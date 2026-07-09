"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import type { AnalysisResult, Tier } from "@/lib/types"

interface AnalyzedItem {
  id: string
  result: AnalysisResult
  imageUrl: string
  name: string
}

interface Props {
  result: AnalysisResult
  imageUrl: string
  items: AnalyzedItem[]
  currentId: string
  onNavigate: (id: string) => void
  onBack: () => void
}

const TIER_META: Record<Tier, { label: string; color: string; ring: string }> = {
  "must-fix": { label: "Must-fix", color: "var(--tr-red)", ring: "var(--tr-red)" },
  "should-consider": { label: "Should-consider", color: "var(--tr-orange)", ring: "var(--tr-orange)" },
  "nice-to-have": { label: "Nice-to-have", color: "var(--gray-3)", ring: "var(--gray-3)" },
}

// Minimum region size so hovering a point marker still reveals a visible
// highlight box around the section it points to.
const MIN_BOX = 0.08

export function ResultView({ result, imageUrl, items, currentId, onNavigate, onBack }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const cardRefs = useRef<Record<number, HTMLLIElement | null>>({})

  // The annotation whose region should be revealed: hover takes priority.
  const active = hovered ?? selected

  // Reset transient state when switching between analyzed artifacts.
  useEffect(() => {
    setSelected(null)
    setHovered(null)
  }, [currentId])

  useEffect(() => {
    if (selected == null) return
    cardRefs.current[selected]?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [selected])

  const currentIndex = items.findIndex((it) => it.id === currentId)
  const hasNav = items.length > 1
  const prev = currentIndex > 0 ? items[currentIndex - 1] : null
  const next = currentIndex < items.length - 1 ? items[currentIndex + 1] : null

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      {/* Top row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-graphite hover:text-tr-orange"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to session
        </button>
        <ul className="flex items-center gap-4">
          {(Object.keys(TIER_META) as Tier[]).map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: TIER_META[t].color }}
                aria-hidden
              />
              <span className="text-xs font-medium text-gray-4">{TIER_META[t].label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Artifact navigation between analyzed images */}
      {hasNav && (
        <div className="mt-5 flex items-center justify-between border border-gray-2 bg-gray-1 px-3 py-2">
          <button
            type="button"
            onClick={() => prev && onNavigate(prev.id)}
            disabled={!prev}
            className="inline-flex items-center gap-1 text-sm font-medium text-graphite transition-colors hover:text-tr-orange disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Prev
          </button>
          <div className="flex min-w-0 flex-col items-center px-2 text-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-4">
              Image {currentIndex + 1} of {items.length}
            </span>
            <span className="max-w-[220px] truncate text-xs text-graphite" title={items[currentIndex]?.name}>
              {items[currentIndex]?.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => next && onNavigate(next.id)}
            disabled={!next}
            className="inline-flex items-center gap-1 text-sm font-medium text-graphite transition-colors hover:text-tr-orange disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      {/* Artifact summary */}
      <p className="mt-5 border-l-2 border-tr-orange pl-3 text-[15px] leading-relaxed text-graphite">
        {result.artifact_summary}
      </p>

      {/* Two-column layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Left: image with overlay */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative inline-block w-full border border-gray-2 bg-gray-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl || "/placeholder.svg"} alt="Analyzed design artifact" className="block w-full" />
            <div className="pointer-events-none absolute inset-0">
              {result.annotations.map((a) => {
                const meta = TIER_META[a.tier]
                const isActive = active === a.number
                // Enforce a minimum visible region so point markers still get a box.
                const boxW = Math.max(a.location.w, MIN_BOX)
                const boxH = Math.max(a.location.h, MIN_BOX)
                return (
                  <div key={a.number}>
                    {/* Region box appears only for the hovered/selected marker */}
                    {isActive && (
                      <div
                        className="absolute border-2 border-dashed transition-opacity"
                        style={{
                          left: `${(a.location.x - boxW / 2) * 100}%`,
                          top: `${(a.location.y - boxH / 2) * 100}%`,
                          width: `${boxW * 100}%`,
                          height: `${boxH * 100}%`,
                          borderColor: meta.color,
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setSelected(a.number)}
                      onMouseEnter={() => setHovered(a.number)}
                      onMouseLeave={() => setHovered(null)}
                      aria-label={`Annotation ${a.number}: ${meta.label}`}
                      className="pointer-events-auto absolute flex items-center justify-center rounded-full font-bold text-white transition-transform"
                      style={{
                        left: `${a.location.x * 100}%`,
                        top: `${a.location.y * 100}%`,
                        width: "28px",
                        height: "28px",
                        transform: `translate(-50%, -50%) scale(${isActive ? 1.25 : 1})`,
                        backgroundColor: meta.color,
                        boxShadow: isActive ? "0 0 0 3px #fff, 0 0 0 5px " + meta.color : "0 0 0 2px #fff",
                        fontSize: "13px",
                        zIndex: isActive ? 2 : 1,
                      }}
                    >
                      {a.number}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: comment cards */}
        <ul className="flex flex-col gap-3">
          {result.annotations.map((a) => {
            const meta = TIER_META[a.tier]
            const isActive = active === a.number
            return (
              <li
                key={a.number}
                ref={(el) => {
                  cardRefs.current[a.number] = el
                }}
                onMouseEnter={() => setHovered(a.number)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(a.number)}
                className="cursor-pointer border border-gray-2 bg-white p-4 transition-shadow"
                style={
                  isActive
                    ? { boxShadow: `0 0 0 2px ${meta.ring}`, borderColor: "transparent" }
                    : undefined
                }
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden
                  >
                    {a.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-white"
                        style={{ backgroundColor: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <span className="inline-flex items-center border border-gray-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-gray-4">
                        {a.skill}
                      </span>
                    </div>
                    <p className="text-sm font-bold leading-snug text-graphite">{a.observation}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-4">{a.rationale}</p>
                    <p className="mt-2.5 text-sm font-medium leading-relaxed text-racing-green">
                      <span aria-hidden>→ </span>
                      {a.suggested_action}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
