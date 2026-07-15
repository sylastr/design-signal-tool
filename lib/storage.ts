"use client"

import { useCallback, useEffect, useState } from "react"
import {
  DEFAULT_SKILLS,
  type AnalysisPrefs,
  type SavedContext,
  type Skill,
} from "./types"

const CONTEXTS_KEY = "design-signal:contexts"
const CUSTOM_SKILLS_KEY = "design-signal:custom-skills"
const SKILL_OVERRIDES_KEY = "design-signal:skill-overrides"
const HIDDEN_SKILLS_KEY = "design-signal:hidden-skills"
const DRAFT_CONTEXT_KEY = "design-signal:draft-context"
const ANALYSIS_PREFS_KEY = "design-signal:analysis-prefs"
const ONBOARDING_KEY = "design-signal:onboarding-complete"

// Overrides for built-in skills, keyed by skill id. Lets users customize the
// default lenses without losing the ability to reset them back to shipped copy.
type SkillOverride = { name?: string; description?: string; instructions?: string }
type SkillOverrides = Record<string, SkillOverride>

// Every key this app persists. Kept together so a reset wipes everything
// (including onboarding, so a reset returns the user to a fresh first-run).
const ALL_STORAGE_KEYS = [
  CONTEXTS_KEY,
  CUSTOM_SKILLS_KEY,
  SKILL_OVERRIDES_KEY,
  HIDDEN_SKILLS_KEY,
  DRAFT_CONTEXT_KEY,
  ANALYSIS_PREFS_KEY,
  ONBOARDING_KEY,
]

/* Wipe all persisted data (skills, contexts, drafts, analysis prefs) and reload
   so every hook re-hydrates to its defaults. */
export function clearAllData() {
  if (typeof window === "undefined") return
  try {
    for (const key of ALL_STORAGE_KEYS) {
      window.localStorage.removeItem(key)
    }
  } catch {
    /* ignore private mode / access errors */
  }
  window.location.reload()
}

/* ---------- Backup: export / import the whole configuration ---------- */

const EXPORT_VERSION = 1

interface ConfigBundle {
  app: "design-signal"
  version: number
  exportedAt: string
  contexts: SavedContext[]
  customSkills: Skill[]
  skillOverrides: SkillOverrides
  hiddenSkills: string[]
  analysisPrefs: Partial<AnalysisPrefs>
}

/* Gather everything the user has added/customized into one JSON file and
   trigger a download. Excludes ephemeral state (uploaded images, drafts). */
export function exportConfig() {
  if (typeof window === "undefined") return
  const bundle: ConfigBundle = {
    app: "design-signal",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    contexts: readJSON<SavedContext[]>(CONTEXTS_KEY, []),
    customSkills: readJSON<Skill[]>(CUSTOM_SKILLS_KEY, []),
    skillOverrides: readJSON<SkillOverrides>(SKILL_OVERRIDES_KEY, {}),
    hiddenSkills: readJSON<string[]>(HIDDEN_SKILLS_KEY, []),
    analysisPrefs: readJSON<Partial<AnalysisPrefs>>(ANALYSIS_PREFS_KEY, {}),
  }
  const stamp = new Date().toISOString().slice(0, 10)
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `design-signal-config-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/* Merge an exported bundle back into local storage. Existing entries are kept;
   entries that share an id are overwritten by the imported copy. Skills and
   contexts are restored at the global level so they persist across sessions.
   Returns a summary so the UI can confirm what was restored. Caller reloads. */
export function importConfig(raw: string): {
  ok: boolean
  error?: string
  imported?: { contexts: number; customSkills: number; overrides: number }
} {
  if (typeof window === "undefined") return { ok: false, error: "Unavailable." }
  let data: Partial<ConfigBundle>
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, error: "That file isn't valid JSON." }
  }
  if (!data || typeof data !== "object" || data.app !== "design-signal") {
    return { ok: false, error: "This doesn't look like a Design Signal config file." }
  }

  let contextsCount = 0
  let skillsCount = 0
  let overridesCount = 0

  try {
    // Contexts — merge by id, force global scope so they surface in Settings.
    if (Array.isArray(data.contexts)) {
      const existing = readJSON<SavedContext[]>(CONTEXTS_KEY, [])
      const byId = new Map(existing.map((c) => [c.id, c]))
      for (const c of data.contexts) {
        if (!c || typeof c.id !== "string") continue
        byId.set(c.id, { ...c, scope: "global" })
        contextsCount++
      }
      writeJSON(CONTEXTS_KEY, [...byId.values()])
    }

    // Custom skills — merge by id.
    if (Array.isArray(data.customSkills)) {
      const existing = readJSON<Skill[]>(CUSTOM_SKILLS_KEY, [])
      const byId = new Map(existing.map((s) => [s.id, s]))
      for (const s of data.customSkills) {
        if (!s || typeof s.id !== "string") continue
        byId.set(s.id, { ...s, custom: true })
        skillsCount++
      }
      writeJSON(CUSTOM_SKILLS_KEY, [...byId.values()])
    }

    // Built-in skill overrides — merge object.
    if (data.skillOverrides && typeof data.skillOverrides === "object") {
      const existing = readJSON<SkillOverrides>(SKILL_OVERRIDES_KEY, {})
      const merged = { ...existing, ...data.skillOverrides }
      overridesCount = Object.keys(data.skillOverrides).length
      writeJSON(SKILL_OVERRIDES_KEY, merged)
    }

    // Hidden skills — union.
    if (Array.isArray(data.hiddenSkills)) {
      const existing = readJSON<string[]>(HIDDEN_SKILLS_KEY, [])
      writeJSON(HIDDEN_SKILLS_KEY, [...new Set([...existing, ...data.hiddenSkills])])
    }

    // Analysis prefs — imported values win.
    if (data.analysisPrefs && typeof data.analysisPrefs === "object") {
      const existing = readJSON<Partial<AnalysisPrefs>>(ANALYSIS_PREFS_KEY, {})
      writeJSON(ANALYSIS_PREFS_KEY, { ...existing, ...data.analysisPrefs })
    }
  } catch {
    return { ok: false, error: "Something went wrong while restoring the file." }
  }

  return {
    ok: true,
    imported: { contexts: contextsCount, customSkills: skillsCount, overrides: overridesCount },
  }
}

export const MIN_SUGGESTIONS = 1
export const MAX_SUGGESTIONS = 7
export const DEFAULT_SUGGESTIONS = 3

function clampCount(n: number) {
  if (!Number.isFinite(n)) return DEFAULT_SUGGESTIONS
  return Math.min(MAX_SUGGESTIONS, Math.max(MIN_SUGGESTIONS, Math.round(n)))
}

// All tiers and paragraphs are shown by default, so results are complete until
// the user deliberately narrows them in Settings → Analysis.
export const DEFAULT_ANALYSIS_PREFS: AnalysisPrefs = {
  tiers: { "must-fix": true, "should-consider": true, "nice-to-have": true },
  sections: { observation: true, rationale: true, suggested_action: true },
  maxSuggestions: DEFAULT_SUGGESTIONS,
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota / private mode errors */
  }
}

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}

/* First-run onboarding flag. Starts "completed" until hydrated so the dialog
   never flashes during SSR/hydration; only shows when we've confirmed the user
   hasn't finished it yet. Cleared by a full reset. */
export function useOnboarding() {
  const [completed, setCompleted] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCompleted(readJSON<boolean>(ONBOARDING_KEY, false))
    setHydrated(true)
  }, [])

  const complete = useCallback(() => {
    setCompleted(true)
    writeJSON(ONBOARDING_KEY, true)
  }, [])

  return { completed, hydrated, complete }
}

/* The working context draft, persisted so it survives refreshes/returns. */
export function useDraftContext() {
  const [text, setText] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setText(readJSON<string>(DRAFT_CONTEXT_KEY, ""))
    setHydrated(true)
  }, [])

  // Persist only after hydration so we don't overwrite storage with the
  // initial empty value on first render.
  useEffect(() => {
    if (hydrated) writeJSON(DRAFT_CONTEXT_KEY, text)
  }, [text, hydrated])

  return [text, setText] as const
}

/* Platform-level analysis preferences (tiers, paragraphs, max suggestions),
   persisted so they apply across sessions. Configured in Settings → Analysis. */
export function useAnalysisPrefs() {
  const [prefs, setPrefs] = useState<AnalysisPrefs>(DEFAULT_ANALYSIS_PREFS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readJSON<Partial<AnalysisPrefs>>(ANALYSIS_PREFS_KEY, {})
    setPrefs({
      tiers: { ...DEFAULT_ANALYSIS_PREFS.tiers, ...stored.tiers },
      sections: { ...DEFAULT_ANALYSIS_PREFS.sections, ...stored.sections },
      maxSuggestions: clampCount(stored.maxSuggestions ?? DEFAULT_SUGGESTIONS),
    })
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) writeJSON(ANALYSIS_PREFS_KEY, prefs)
  }, [prefs, hydrated])

  const setTier = useCallback((tier: keyof AnalysisPrefs["tiers"], enabled: boolean) => {
    setPrefs((p) => ({ ...p, tiers: { ...p.tiers, [tier]: enabled } }))
  }, [])

  const setSection = useCallback((section: keyof AnalysisPrefs["sections"], enabled: boolean) => {
    setPrefs((p) => ({ ...p, sections: { ...p.sections, [section]: enabled } }))
  }, [])

  const setMaxSuggestions = useCallback((n: number) => {
    setPrefs((p) => ({ ...p, maxSuggestions: clampCount(n) }))
  }, [])

  return { prefs, setTier, setSection, setMaxSuggestions }
}

/* Saved project contexts persisted in localStorage. */
export function useSavedContexts() {
  const [contexts, setContexts] = useState<SavedContext[]>([])

  useEffect(() => {
    setContexts(readJSON<SavedContext[]>(CONTEXTS_KEY, []))
  }, [])

  const persist = useCallback((next: SavedContext[]) => {
    setContexts(next)
    writeJSON(CONTEXTS_KEY, next)
  }, [])

  const add = useCallback(
    (name: string, text: string, scope: "global" | "local" = "global") => {
      const entry: SavedContext = { id: uid(), name, text, scope }
      persist([entry, ...contexts])
    },
    [contexts, persist],
  )

  const update = useCallback(
    (id: string, name: string, text: string) => {
      persist(contexts.map((c) => (c.id === id ? { ...c, name, text } : c)))
    },
    [contexts, persist],
  )

  const remove = useCallback(
    (id: string) => {
      persist(contexts.filter((c) => c.id !== id))
    },
    [contexts, persist],
  )

  // Platform-level visibility: hidden contexts are kept in storage but excluded
  // from the wizard and from the composed analysis context.
  const setHidden = useCallback(
    (id: string, hidden: boolean) => {
      persist(contexts.map((c) => (c.id === id ? { ...c, hidden } : c)))
    },
    [contexts, persist],
  )

  return { contexts, add, update, remove, setHidden }
}

/* Custom analysis skills persisted in localStorage, merged with defaults.
   Platform-level `hidden` state is persisted separately (by id) so it applies
   to both default and custom skills. */
export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS)

  useEffect(() => {
    const custom = readJSON<Skill[]>(CUSTOM_SKILLS_KEY, [])
    const hidden = readJSON<string[]>(HIDDEN_SKILLS_KEY, [])
    const overrides = readJSON<SkillOverrides>(SKILL_OVERRIDES_KEY, {})
    const hiddenSet = new Set(hidden)
    setSkills(
      [...DEFAULT_SKILLS, ...custom].map((s) => {
        // Overrides only apply to built-in skills; custom skills are stored whole.
        const ov = !s.custom ? overrides[s.id] : undefined
        return {
          ...s,
          name: ov?.name ?? s.name,
          description: ov?.description ?? s.description,
          instructions: ov?.instructions ?? s.instructions,
          hidden: hiddenSet.has(s.id),
          edited: !!ov,
        }
      }),
    )
  }, [])

  const persistCustom = useCallback((all: Skill[]) => {
    writeJSON(
      CUSTOM_SKILLS_KEY,
      all.filter((s) => s.custom),
    )
  }, [])

  const persistOverride = useCallback((id: string, data: SkillOverride) => {
    const overrides = readJSON<SkillOverrides>(SKILL_OVERRIDES_KEY, {})
    overrides[id] = data
    writeJSON(SKILL_OVERRIDES_KEY, overrides)
  }, [])

  const clearOverride = useCallback((id: string) => {
    const overrides = readJSON<SkillOverrides>(SKILL_OVERRIDES_KEY, {})
    delete overrides[id]
    writeJSON(SKILL_OVERRIDES_KEY, overrides)
  }, [])

  const persistHidden = useCallback((all: Skill[]) => {
    writeJSON(
      HIDDEN_SKILLS_KEY,
      all.filter((s) => s.hidden).map((s) => s.id),
    )
  }, [])

  const toggle = useCallback((id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    )
  }, [])

  // Set a skill's session selection (active) to an explicit value. Used by
  // onboarding to pre-select skills for the review flow without hiding any.
  const setActive = useCallback((id: string, active: boolean) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active } : s)),
    )
  }, [])

  const addCustom = useCallback(
    (name: string, description: string, instructions: string) => {
      setSkills((prev) => {
        const next = [
          ...prev,
          { id: uid(), name, description, instructions, active: true, custom: true },
        ]
        persistCustom(next)
        return next
      })
    },
    [persistCustom],
  )

  // Edit any skill. Custom skills persist whole; built-in skills persist an
  // override (so they can later be reset to their shipped copy).
  const updateSkill = useCallback(
    (id: string, name: string, description: string, instructions: string) => {
      setSkills((prev) => {
        const target = prev.find((s) => s.id === id)
        if (!target) return prev
        const next = prev.map((s) =>
          s.id === id ? { ...s, name, description, instructions, edited: !s.custom } : s,
        )
        if (target.custom) {
          persistCustom(next)
        } else {
          persistOverride(id, { name, description, instructions })
        }
        return next
      })
    },
    [persistCustom, persistOverride],
  )

  // Restore a built-in skill to its shipped copy by dropping its override.
  const resetSkill = useCallback(
    (id: string) => {
      clearOverride(id)
      setSkills((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s
          const def = DEFAULT_SKILLS.find((d) => d.id === id)
          if (!def) return s
          return {
            ...s,
            name: def.name,
            description: def.description,
            instructions: def.instructions,
            edited: false,
          }
        }),
      )
    },
    [clearOverride],
  )

  const removeCustom = useCallback(
    (id: string) => {
      setSkills((prev) => {
        const next = prev.filter((s) => s.id !== id)
        persistCustom(next)
        persistHidden(next)
        return next
      })
    },
    [persistCustom, persistHidden],
  )

  // Platform-level visibility toggle, applies to default and custom skills.
  const setHidden = useCallback(
    (id: string, hidden: boolean) => {
      setSkills((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, hidden } : s))
        persistHidden(next)
        return next
      })
    },
    [persistHidden],
  )

  return { skills, toggle, setActive, addCustom, updateSkill, resetSkill, removeCustom, setHidden }
}
