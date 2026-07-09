"use client"

import { useCallback, useEffect, useState } from "react"
import { DEFAULT_SKILLS, type SavedContext, type Skill } from "./types"

const CONTEXTS_KEY = "design-signal:contexts"
const CUSTOM_SKILLS_KEY = "design-signal:custom-skills"
const DRAFT_CONTEXT_KEY = "design-signal:draft-context"
const SUGGESTION_COUNT_KEY = "design-signal:suggestion-count"

export const MIN_SUGGESTIONS = 1
export const MAX_SUGGESTIONS = 7
export const DEFAULT_SUGGESTIONS = 3

function clampCount(n: number) {
  if (!Number.isFinite(n)) return DEFAULT_SUGGESTIONS
  return Math.min(MAX_SUGGESTIONS, Math.max(MIN_SUGGESTIONS, Math.round(n)))
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

/* How many suggestions to request per analysis, persisted (default 3, 1-7). */
export function useSuggestionCount() {
  const [count, setCountState] = useState(DEFAULT_SUGGESTIONS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCountState(clampCount(readJSON<number>(SUGGESTION_COUNT_KEY, DEFAULT_SUGGESTIONS)))
    setHydrated(true)
  }, [])

  const setCount = useCallback((n: number) => setCountState(clampCount(n)), [])

  useEffect(() => {
    if (hydrated) writeJSON(SUGGESTION_COUNT_KEY, count)
  }, [count, hydrated])

  return [count, setCount] as const
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
    (name: string, text: string) => {
      const entry: SavedContext = { id: uid(), name, text }
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

  return { contexts, add, update, remove }
}

/* Custom analysis lenses persisted in localStorage, merged with defaults. */
export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS)

  useEffect(() => {
    const custom = readJSON<Skill[]>(CUSTOM_SKILLS_KEY, [])
    setSkills([...DEFAULT_SKILLS, ...custom])
  }, [])

  const persistCustom = useCallback((all: Skill[]) => {
    writeJSON(
      CUSTOM_SKILLS_KEY,
      all.filter((s) => s.custom),
    )
  }, [])

  const toggle = useCallback((id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    )
  }, [])

  const addCustom = useCallback(
    (name: string, instructions: string) => {
      setSkills((prev) => {
        const next = [
          ...prev,
          { id: uid(), name, instructions, active: true, custom: true },
        ]
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
        return next
      })
    },
    [persistCustom],
  )

  return { skills, toggle, addCustom, removeCustom }
}
