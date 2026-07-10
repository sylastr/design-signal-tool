"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { ArtifactIntake } from "@/components/session/artifact-intake"
import { ContextPanel } from "@/components/session/context-panel"
import { SkillsPanel } from "@/components/session/skills-panel"
import { StepIndicator, type Step } from "@/components/session/step-indicator"
import { WizardBar } from "@/components/session/wizard-bar"
import { ResultView } from "@/components/result/result-view"
import { useDraftContext, useSavedContexts, useSkills, useSuggestionCount } from "@/lib/storage"
import type { AnalysisResult, Artifact } from "@/lib/types"

interface CachedResult {
  result: AnalysisResult
  imageUrl: string
  name: string
}

// The stepped flow: users cannot analyze until they've supplied an image, then
// context, then a skill — which keeps critiques specific instead of generic.
const STEPS: Step[] = [
  { id: "artifacts", label: "Artifacts", hint: "Add the designs to review" },
  { id: "context", label: "Context", hint: "Describe the project & users" },
  { id: "skills", label: "Skill", hint: "Choose your critique lens" },
]

// Minimum characters of context required to advance. Enough to force a real
// sentence rather than a stray character.
const MIN_CONTEXT = 12

export default function Page() {
  const [step, setStep] = useState(0)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  // Analysis results cached per artifact id, so navigating between them never
  // triggers a re-analysis.
  const [results, setResults] = useState<Record<string, CachedResult>>({})
  const [viewingId, setViewingId] = useState<string | null>(null)
  // Remembers the last analysis viewed so we can return to it.
  const [lastViewedId, setLastViewedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [contextText, setContextText] = useDraftContext()
  const [suggestionCount, setSuggestionCount] = useSuggestionCount()
  const { contexts, add, update, remove } = useSavedContexts()
  const { skills, toggle, addCustom, removeCustom } = useSkills()

  const activeSkills = useMemo(() => skills.filter((s) => s.active), [skills])

  const handleAdd = (next: Artifact[]) => {
    setArtifacts((prev) => [...prev, ...next])
  }

  // Clear every uploaded artifact along with its cached results.
  const handleRemoveAll = () => {
    setArtifacts([])
    setResults({})
    setViewingId(null)
  }

  const handleRemove = (id: string) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== id))
    // Drop any cached analysis for the removed artifact.
    setResults((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
    setViewingId((prev) => (prev === id ? null : prev))
  }

  // Analyze the whole batch sequentially, caching each result as it lands.
  const runAnalysis = async (targets: Artifact[]) => {
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
            count: suggestionCount,
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Analysis failed.")
        }
        const data: AnalysisResult = await res.json()
        setResults((prev) => ({
          ...prev,
          [target.id]: { result: data, imageUrl: target.dataUrl, name: target.name },
        }))
        if (!firstId) firstId = target.id
      }
      if (firstId) setViewingId(firstId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAnalyze = () => {
    if (!artifacts.length || !activeSkills.length) return
    void runAnalysis(artifacts)
  }

  // Analyzed artifacts in upload order — used to navigate between result pages.
  const analyzedItems = useMemo(
    () => artifacts.filter((a) => results[a.id]).map((a) => ({ id: a.id, ...results[a.id] })),
    [artifacts, results],
  )
  const viewing = viewingId ? results[viewingId] : null
  const showResult = viewing != null

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

  // Return to an existing analysis without re-running it.
  const handleViewResults = () => {
    const target =
      (lastViewedId && results[lastViewedId] && lastViewedId) || analyzedItems[0]?.id || null
    if (target) setViewingId(target)
  }

  // Step gating — strictly forward. Each gate must be satisfied to advance.
  const contextReady = contextText.trim().length >= MIN_CONTEXT
  const gates = [artifacts.length > 0, contextReady, activeSkills.length > 0 && artifacts.length > 0]
  const canAdvance = gates[step]

  const gateHint = useMemo(() => {
    if (step === 0) {
      return artifacts.length > 0
        ? `${artifacts.length} ${artifacts.length === 1 ? "image" : "images"} ready to review`
        : "Add at least one design image to continue"
    }
    if (step === 1) {
      return contextReady
        ? "Context looks good — you can continue"
        : "Describe the project and its users to continue (a sentence or two)"
    }
    return activeSkills.length > 0
      ? `${activeSkills.length} ${activeSkills.length === 1 ? "skill" : "skills"} selected`
      : "Pick at least one analysis skill to continue"
  }, [step, artifacts.length, contextReady, activeSkills.length])

  const goNext = () => {
    if (canAdvance) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  const goBack = () => setStep((s) => Math.max(s - 1, 0))
  // Only allow jumping to an already-reached (<= current) step.
  const handleStepClick = (i: number) => {
    if (i <= step) setStep(i)
  }

  const batchHasResult = artifacts.length > 0 && artifacts.every((a) => results[a.id])

  return (
    <div className="min-h-screen bg-white">
      <Header />

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
            <StepIndicator steps={STEPS} current={step} onStepClick={handleStepClick} />

            {/* Step 1 — Artifacts */}
            {step === 0 && (
              <ArtifactIntake
                wizard
                artifacts={artifacts}
                selectedIds={[]}
                analyzedIds={[]}
                recommendationCounts={{}}
                onAdd={handleAdd}
                onSelectionChange={() => {}}
                onRemove={handleRemove}
                onRemoveAll={handleRemoveAll}
                onViewAnalysis={() => {}}
                onAnalyze={() => {}}
              />
            )}

            {/* Step 2 — Context */}
            {step === 1 && (
              <ContextPanel
                contextText={contextText}
                onContextChange={setContextText}
                contexts={contexts}
                onSave={add}
                onUpdate={update}
                onRemove={remove}
              />
            )}

            {/* Step 3 — Skill */}
            {step === 2 && (
              <SkillsPanel
                skills={skills}
                onToggle={toggle}
                onAddCustom={addCustom}
                onRemoveCustom={removeCustom}
              />
            )}

            {error && (
              <p
                role="alert"
                className="mt-8 border border-tr-red bg-white px-4 py-3 text-sm font-medium text-tr-red"
              >
                {error}
              </p>
            )}
          </main>

          <WizardBar
            isFirst={step === 0}
            isLast={step === STEPS.length - 1}
            canAdvance={canAdvance}
            gateHint={gateHint}
            analyzing={analyzing}
            suggestionCount={suggestionCount}
            onSuggestionCountChange={setSuggestionCount}
            onBack={goBack}
            onNext={goNext}
            onAnalyze={handleAnalyze}
            analyzedCount={analyzedItems.length}
            batchHasResult={batchHasResult}
            onViewResults={handleViewResults}
          />
        </>
      )}
    </div>
  )
}
