"use client"

import { useMemo, useState } from "react"
import { Header } from "@/components/header"
import { ArtifactIntake } from "@/components/session/artifact-intake"
import { ContextPanel } from "@/components/session/context-panel"
import { SkillsPanel } from "@/components/session/skills-panel"
import { BottomBar } from "@/components/session/bottom-bar"
import { ResultView } from "@/components/result/result-view"
import { useSavedContexts, useSkills } from "@/lib/storage"
import type { AnalysisResult, Artifact } from "@/lib/types"

export default function Page() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [contextText, setContextText] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [resultImage, setResultImage] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

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
  }

  const handleFigmaChange = (id: string, link: string) => {
    setArtifacts((prev) => prev.map((a) => (a.id === id ? { ...a, figmaLink: link } : a)))
  }

  const handleAnalyze = async () => {
    if (!activeArtifact) return
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: activeArtifact.dataUrl,
          context: contextText,
          activeSkills: activeSkills.map((s) => ({ name: s.name, instructions: s.instructions })),
          figmaLink: activeArtifact.figmaLink,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Analysis failed.")
      }
      const data: AnalysisResult = await res.json()
      setResult(data)
      setResultImage(activeArtifact.dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.")
    } finally {
      setAnalyzing(false)
    }
  }

  const showResult = result !== null

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {showResult ? (
        <main>
          <ResultView result={result} imageUrl={resultImage} onBack={() => setResult(null)} />
        </main>
      ) : (
        <>
          <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col gap-10">
                <ArtifactIntake
                  artifacts={artifacts}
                  activeId={activeId}
                  onAdd={handleAdd}
                  onSelect={setActiveId}
                  onRemove={handleRemove}
                  onFigmaChange={handleFigmaChange}
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
            activeLensCount={activeSkills.length}
            analyzing={analyzing}
            onAnalyze={handleAnalyze}
          />
        </>
      )}
    </div>
  )
}
