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
const HIDDEN_SKILLS_KEY = "design-signal:hidden-skills"
const DRAFT_CONTEXT_KEY = "design-signal:draft-context"
const ANALYSIS_PREFS_KEY = "design-signal:analysis-prefs"
const ONBOARDING_KEY = "design-signal:onboarding-complete"

// Every key this app persists. Kept together so a reset wipes everything
// (including onboarding, so a reset returns the user to a fresh first-run).
const ALL_STORAGE_KEYS = [
  CONTEXTS_KEY,
  CUSTOM_SKILLS_KEY,
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
    const hiddenSet = new Set(hidden)
    setSkills(
      [...DEFAULT_SKILLS, ...custom].map((s) => ({ ...s, hidden: hiddenSet.has(s.id) })),
    )
  }, [])

  const persistCustom = useCallback((all: Skill[]) => {
    writeJSON(
      CUSTOM_SKILLS_KEY,
      all.filter((s) => s.custom),
    )
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

  const updateCustom = useCallback(
    (id: string, name: string, description: string, instructions: string) => {
      setSkills((prev) => {
        const next = prev.map((s) =>
          s.id === id && s.custom ? { ...s, name, description, instructions } : s,
        )
        persistCustom(next)
        return next
      })
    },
    [persistCustom],
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

  return { skills, toggle, setActive, addCustom, updateCustom, removeCustom, setHidden }
}
