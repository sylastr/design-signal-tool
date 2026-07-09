"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft } from "lucide-react"
import type { AnalysisResult, Tier } from "@/lib/types"

interface Props {
  result: AnalysisResult
  imageUrl: string
  onBack: () => void
}

const TIER_META: Record<Tier, { label: string; color: string; ring: string }> = {
  "must-fix": { label: "Must-fix", color: "var(--tr-red)", ring: "var(--tr-red)" },
  "should-consider": { label: "Should-consider", color: "var(--tr-orange)", ring: "var(--tr-orange)" },
  "nice-to-have": { label: "Nice-to-have", color: "var(--gray-3)", ring: "var(--gray-3)" },
}

const BOX_THRESHOLD = 0.08

export function ResultView({ result, imageUrl, onBack }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const cardRefs = useRef<Record<number, HTMLLIElement | null>>({})

  useEffect(() => {
    if (selected == null) return
    cardRefs.current[selected]?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [selected])

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
                const isSel = selected === a.number
                const showBox = a.location.w > BOX_THRESHOLD || a.location.h > BOX_THRESHOLD
                return (
                  <div key={a.number}>
                    {showBox && (
                      <div
                        className="absolute border-2 border-dashed"
                        style={{
                          left: `${(a.location.x - a.location.w / 2) * 100}%`,
                          top: `${(a.location.y - a.location.h / 2) * 100}%`,
                          width: `${a.location.w * 100}%`,
                          height: `${a.location.h * 100}%`,
                          borderColor: meta.color,
                          opacity: isSel ? 1 : 0.7,
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setSelected(a.number)}
                      aria-label={`Annotation ${a.number}: ${meta.label}`}
                      className="pointer-events-auto absolute flex items-center justify-center rounded-full font-bold text-white transition-transform"
                      style={{
                        left: `${a.location.x * 100}%`,
                        top: `${a.location.y * 100}%`,
                        width: "28px",
                        height: "28px",
                        transform: `translate(-50%, -50%) scale(${isSel ? 1.25 : 1})`,
                        backgroundColor: meta.color,
                        boxShadow: isSel ? "0 0 0 3px #fff, 0 0 0 5px " + meta.color : "0 0 0 2px #fff",
                        fontSize: "13px",
                        zIndex: isSel ? 2 : 1,
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
            const isSel = selected === a.number
            return (
              <li
                key={a.number}
                ref={(el) => {
                  cardRefs.current[a.number] = el
                }}
                onMouseEnter={() => setSelected(a.number)}
                onClick={() => setSelected(a.number)}
                className="cursor-pointer border border-gray-2 bg-white p-4 transition-shadow"
                style={
                  isSel
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
