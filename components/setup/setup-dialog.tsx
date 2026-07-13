"use client"

import { useEffect, useRef, useState } from "react"
import { Layers, RotateCcw, ScrollText, SlidersHorizontal, X } from "lucide-react"
import type { AnalysisPrefs, SavedContext, SectionKey, Skill, Tier } from "@/lib/types"
import { SetupSkillsPane } from "@/components/setup/setup-skills-pane"
import { SetupContextsPane } from "@/components/setup/setup-contexts-pane"
import { SetupAnalysisPane } from "@/components/setup/setup-analysis-pane"
import { SetupResetPane } from "@/components/setup/setup-reset-pane"

type Tab = "skills" | "contexts" | "analysis" | "reset"

interface Props {
  open: boolean
  onClose: () => void
  /** Section to show when the dialog opens. Defaults to "skills". */
  initialTab?: Tab
  skills: Skill[]
  contexts: SavedContext[]
  analysisPrefs: AnalysisPrefs
  onAddSkill: (name: string, description: string, instructions: string) => void
  onUpdateSkill: (id: string, name: string, description: string, instructions: string) => void
  onRemoveSkill: (id: string) => void
  onToggleSkillHidden: (id: string, hidden: boolean) => void
  onAddContext: (name: string, text: string) => void
  onUpdateContext: (id: string, name: string, text: string) => void
  onRemoveContext: (id: string) => void
  onToggleContextHidden: (id: string, hidden: boolean) => void
  onToggleTier: (tier: Tier, enabled: boolean) => void
  onToggleSection: (section: SectionKey, enabled: boolean) => void
  onMaxSuggestionsChange: (n: number) => void
}

export function SetupDialog({
  open,
  onClose,
  initialTab,
  skills,
  contexts,
  analysisPrefs,
  onAddSkill,
  onUpdateSkill,
  onRemoveSkill,
  onToggleSkillHidden,
  onAddContext,
  onUpdateContext,
  onRemoveContext,
  onToggleContextHidden,
  onToggleTier,
  onToggleSection,
  onMaxSuggestionsChange,
}: Props) {
  const [tab, setTab] = useState<Tab>("skills")
  const dialogRef = useRef<HTMLDivElement>(null)

  // Land on the requested section each time the dialog opens.
  useEffect(() => {
    if (open) setTab(initialTab ?? "skills")
  }, [open, initialTab])

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const navItems: { id: Tab; label: string; icon: typeof Layers; count?: number }[] = [
    { id: "skills", label: "Skills", icon: ScrollText, count: skills.length },
    { id: "contexts", label: "Contexts", icon: Layers, count: contexts.length },
    { id: "analysis", label: "Analysis", icon: SlidersHorizontal },
    { id: "reset", label: "Reset", icon: RotateCcw },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close setup"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-graphite/40"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-title"
        tabIndex={-1}
        className="relative flex h-[80vh] max-h-[720px] w-full max-w-4xl overflow-hidden border border-gray-2 bg-white shadow-2xl outline-none"
      >
        {/* Sidebar */}
        <aside className="flex w-48 shrink-0 flex-col border-r border-gray-2 bg-gray-1 py-4 sm:w-56">
          <p
            id="setup-title"
            className="px-4 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
          >
            Setup
          </p>
          <nav className="flex flex-col" aria-label="Setup sections">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2.5 border-l-2 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? "border-tr-orange bg-white text-graphite"
                      : "border-transparent text-gray-4 hover:bg-white hover:text-graphite"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  {item.count !== undefined && (
                    <span className="text-xs text-gray-3">{item.count}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-end border-b border-gray-2 px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close setup"
              className="flex h-8 w-8 items-center justify-center border border-transparent text-gray-4 transition-colors hover:border-gray-3 hover:text-graphite"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="ds-scroll flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {tab === "skills" && (
              <SetupSkillsPane
                skills={skills}
                onAddCustom={onAddSkill}
                onUpdateCustom={onUpdateSkill}
                onRemoveCustom={onRemoveSkill}
                onToggleHidden={onToggleSkillHidden}
              />
            )}
            {tab === "contexts" && (
              <SetupContextsPane
                contexts={contexts}
                onAdd={onAddContext}
                onUpdate={onUpdateContext}
                onRemove={onRemoveContext}
                onToggleHidden={onToggleContextHidden}
              />
            )}
            {tab === "analysis" && (
              <SetupAnalysisPane
                prefs={analysisPrefs}
                onToggleTier={onToggleTier}
                onToggleSection={onToggleSection}
                onMaxSuggestionsChange={onMaxSuggestionsChange}
              />
            )}
            {tab === "reset" && <SetupResetPane />}
          </div>
        </div>
      </div>
    </div>
  )
}
