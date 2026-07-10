"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { ArtifactIntake } from "@/components/session/artifact-intake"
import { ContextPanel } from "@/components/session/context-panel"
import { SkillsPanel } from "@/components/session/skills-panel"
import { BottomBar } from "@/components/session/bottom-bar"
import { ResultView } from "@/components/result/result-view"
import { OpenArenaTokenModal } from "@/components/open-arena-token-modal"
import { useDraftContext, useSavedContexts, useSkills, useSuggestionCount } from "@/lib/storage"
import type { AnalysisResult, Artifact } from "@/lib/types"

interface CachedResult {
  result: AnalysisResult
  imageUrl: string
  name: string
}

export default function Page() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  // Analysis results cached per artifact id, so navigating between them never
  // triggers a re-analysis.
  const [results, setResults] = useState<Record<string, CachedResult>>({})
  const [viewingId, setViewingId] = useState<string | null>(null)
  // Remembers the last analysis viewed so we can return to it from the session.
  const [lastViewedId, setLastViewedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Open Arena API token — kept in memory only for this session, never persisted.
  const [token, setToken] = useState("")
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [pendingAnalyze, setPendingAnalyze] = useState(false)

  const [contextText, setContextText] = useDraftContext()
  const [suggestionCount, setSuggestionCount] = useSuggestionCount()
  const { contexts, add, update, remove } = useSavedContexts()
  const { skills, toggle, addCustom, removeCustom } = useSkills()

  const activeArtifact = useMemo(
    () => artifacts.find((a) => a.id === activeId) ?? null,
    [artifacts, activeId],
  )
  const activeSkills = useMemo(() => skills.filter((s) => s.active), [skills])

  const handleAdd = (next: Artifact[]) => {
    setArtifacts((prev) => {
      const merged = [...prev, ...next]
      return merged
    })
    setActiveId((prev) => prev ?? next[0]?.id ?? null)
  }

  const handleRemove = (id: string) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== id))
    setActiveId((prev) => {
      if (prev !== id) return prev
      const remaining = artifacts.filter((a) => a.id !== id)
      return remaining[0]?.id ?? null
    })
    // Drop any cached analysis for the removed artifact.
    setResults((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
    setViewingId((prev) => (prev === id ? null : prev))
  }

  const runAnalysis = async (authToken: string) => {
    if (!activeArtifact) return
    const target = activeArtifact
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: target.dataUrl,
          context: contextText,
          activeSkills: activeSkills.map((s) => ({ name: s.name, instructions: s.instructions })),
          token: authToken,
          count: suggestionCount,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // Token was missing/invalid — clear it and re-prompt.
        if (res.status === 401) {
          setToken("")
          setPendingAnalyze(true)
          setTokenModalOpen(true)
        }
        throw new Error(data.error || "Analysis failed.")
      }
      const data: AnalysisResult = await res.json()
      // Cache the result under this artifact's id and view it.
      setResults((prev) => ({
        ...prev,
        [target.id]: { result: data, imageUrl: target.dataUrl, name: target.name },
      }))
      setViewingId(target.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAnalyze = () => {
    if (!activeArtifact) return
    // Analysis runs against the AI Gateway by default; a token is only needed
    // if the deployment is configured to route through Open Arena, in which case
    // the API responds 401 and we prompt for one.
    void runAnalysis(token)
  }

  const handleSaveToken = (next: string) => {
    setToken(next)
    if (pendingAnalyze) {
      setPendingAnalyze(false)
      void runAnalysis(next)
    }
  }

  // Analyzed artifacts in upload order — used to navigate between result pages.
  const analyzedItems = useMemo(
    () =>
      artifacts
        .filter((a) => results[a.id])
        .map((a) => ({ id: a.id, ...results[a.id] })),
    [artifacts, results],
  )
  const viewing = viewingId ? results[viewingId] : null
  const showResult = viewing != null

  // Keep a memory of the last result actually viewed.
  useEffect(() => {
    if (viewingId) setLastViewedId(viewingId)
  }, [viewingId])

  // Persist a dragged marker's new position into the cached result so it
  // survives navigation between analyses.
  const handleMoveAnnotation = (artifactId: string, annotationNumber: number, x: number, y: number) => {
    setResults((prev) => {
      const entry = prev[artifactId]
      if (!entry) return prev
      return {
        ...prev,
        [artifactId]: {
          ...entry,
          result: {
            ...entry.result,
            annotations: entry.result.annotations.map((a) =>
              a.number === annotationNumber ? { ...a, location: { ...a.location, x, y } } : a,
            ),
          },
        },
      }
    })
  }

  // Persist a resized region box (center + size) into the cached result.
  const handleResizeAnnotation = (
    artifactId: string,
    annotationNumber: number,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => {
    setResults((prev) => {
      const entry = prev[artifactId]
      if (!entry) return prev
      return {
        ...prev,
        [artifactId]: {
          ...entry,
          result: {
            ...entry.result,
            annotations: entry.result.annotations.map((a) =>
              a.number === annotationNumber ? { ...a, location: { x, y, w, h } } : a,
            ),
          },
        },
      }
    })
  }

  // Return to an existing analysis without re-running it: prefer the active
  // artifact's result, then the most recently viewed, then the first analyzed.
  const handleViewResults = () => {
    const target =
      (activeId && results[activeId] && activeId) ||
      (lastViewedId && results[lastViewedId] && lastViewedId) ||
      analyzedItems[0]?.id ||
      null
    if (target) setViewingId(target)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header tokenSet={!!token} onManageToken={() => setTokenModalOpen(true)} />

      {showResult && viewingId ? (
        <main>
          <ResultView
            result={viewing.result}
            imageUrl={viewing.imageUrl}
            items={analyzedItems}
            currentId={viewingId}
            onNavigate={setViewingId}
            onBack={() => setViewingId(null)}
            onMoveAnnotation={(num, x, y) => handleMoveAnnotation(viewingId, num, x, y)}
            onResizeAnnotation={(num, x, y, w, h) => handleResizeAnnotation(viewingId, num, x, y, w, h)}
          />
        </main>
      ) : (
        <>
          <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col gap-10">
                <ArtifactIntake
                  artifacts={artifacts}
                  activeId={activeId}
                  analyzedIds={analyzedItems.map((a) => a.id)}
                  recommendationCounts={Object.fromEntries(
                    analyzedItems.map((a) => [a.id, a.result.annotations.length]),
                  )}
                  onAdd={handleAdd}
                  onSelect={setActiveId}
                  onRemove={handleRemove}
                      />
                <SkillsPanel
                  skills={skills}
                  onToggle={toggle}
                  onAddCustom={addCustom}
                  onRemoveCustom={removeCustom}
                />
              </div>
              <ContextPanel
                contextText={contextText}
                onContextChange={setContextText}
                contexts={contexts}
                onSave={add}
                onUpdate={update}
                onRemove={remove}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="mt-8 border border-tr-red bg-white px-4 py-3 text-sm font-medium text-tr-red"
              >
                {error}
              </p>
            )}
          </main>

          <BottomBar
            hasArtifact={!!activeArtifact}
            activeSkillCount={activeSkills.length}
            analyzing={analyzing}
            suggestionCount={suggestionCount}
            onSuggestionCountChange={setSuggestionCount}
            onAnalyze={handleAnalyze}
            analyzedCount={analyzedItems.length}
            activeHasResult={!!(activeId && results[activeId])}
            onViewResults={handleViewResults}
          />
        </>
      )}

      <OpenArenaTokenModal
        open={tokenModalOpen}
        onOpenChange={(next) => {
          setTokenModalOpen(next)
          if (!next) setPendingAnalyze(false)
        }}
        onSave={handleSaveToken}
        initialValue={token}
      />
    </div>
  )
}
