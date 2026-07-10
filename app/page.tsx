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
  // Ids selected for analysis. Multiple can be picked via shift-click or drag.
  const [selectedIds, setSelectedIds] = useState<string[]>([])
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

  // Artifacts chosen for analysis, kept in upload order for consistent runs.
  const selectedArtifacts = useMemo(
    () => artifacts.filter((a) => selectedIds.includes(a.id)),
    [artifacts, selectedIds],
  )
  // The primary (last-selected) drives which result opens when viewing.
  const primaryId = selectedIds[selectedIds.length - 1] ?? null
  const activeSkills = useMemo(() => skills.filter((s) => s.active), [skills])

  const handleAdd = (next: Artifact[]) => {
    setArtifacts((prev) => {
      const merged = [...prev, ...next]
      return merged
    })
    // Auto-select the first upload only when nothing is selected yet.
    setSelectedIds((prev) => (prev.length ? prev : next[0] ? [next[0].id] : []))
  }

  // Rename an artifact everywhere it's referenced (list + cached result).
  const handleRename = (id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setArtifacts((prev) => prev.map((a) => (a.id === id ? { ...a, name: trimmed } : a)))
    setResults((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], name: trimmed } } : prev))
  }

  const handleRemove = (id: string) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== id))
    setSelectedIds((prev) => prev.filter((x) => x !== id))
    // Drop any cached analysis for the removed artifact.
    setResults((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
    setViewingId((prev) => (prev === id ? null : prev))
  }

  // Analyze one or more artifacts sequentially, caching each result as it lands.
  const runAnalysis = async (authToken: string, targets: Artifact[]) => {
    if (!targets.length) return
    setAnalyzing(true)
    setError(null)
    try {
      let firstId: string | null = null
      for (const target of targets) {
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
        // Cache the result under this artifact's id.
        setResults((prev) => ({
          ...prev,
          [target.id]: { result: data, imageUrl: target.dataUrl, name: target.name },
        }))
        if (!firstId) firstId = target.id
      }
      // Open the first freshly-analyzed artifact.
      if (firstId) setViewingId(firstId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAnalyze = () => {
    if (!selectedArtifacts.length) return
    // Analysis runs against the AI Gateway by default; a token is only needed
    // if the deployment is configured to route through Open Arena, in which case
    // the API responds 401 and we prompt for one.
    void runAnalysis(token, selectedArtifacts)
  }

  // Analyze a specific set of artifacts (e.g. from a card's context menu),
  // syncing the selection so the bottom bar reflects what ran.
  const handleAnalyzeIds = (ids: string[]) => {
    const targets = artifacts.filter((a) => ids.includes(a.id))
    if (!targets.length) return
    setSelectedIds(ids)
    void runAnalysis(token, targets)
  }

  const handleSaveToken = (next: string) => {
    setToken(next)
    if (pendingAnalyze) {
      setPendingAnalyze(false)
      void runAnalysis(next, selectedArtifacts)
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
      (primaryId && results[primaryId] && primaryId) ||
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
                  selectedIds={selectedIds}
                  analyzedIds={analyzedItems.map((a) => a.id)}
                  recommendationCounts={Object.fromEntries(
                    analyzedItems.map((a) => [a.id, a.result.annotations.length]),
                  )}
                  onAdd={handleAdd}
                  onSelectionChange={setSelectedIds}
                  onRemove={handleRemove}
                  onRename={handleRename}
                  onAnalyze={handleAnalyzeIds}
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
            selectedCount={selectedArtifacts.length}
            activeSkillCount={activeSkills.length}
            analyzing={analyzing}
            suggestionCount={suggestionCount}
            onSuggestionCountChange={setSuggestionCount}
            onAnalyze={handleAnalyze}
            analyzedCount={analyzedItems.length}
            activeHasResult={
              selectedArtifacts.length > 0 && selectedArtifacts.every((a) => results[a.id])
            }
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
