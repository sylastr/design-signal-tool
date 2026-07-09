"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Copy } from "lucide-react"
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
  onMoveAnnotation: (annotationNumber: number, x: number, y: number) => void
  onResizeAnnotation: (annotationNumber: number, x: number, y: number, w: number, h: number) => void
}

type Edge = "left" | "right" | "top" | "bottom"

const TIER_META: Record<Tier, { label: string; color: string; ring: string }> = {
  "must-fix": { label: "Must-fix", color: "var(--tr-red)", ring: "var(--tr-red)" },
  "should-consider": { label: "Should-consider", color: "var(--tr-orange)", ring: "var(--tr-orange)" },
  "nice-to-have": { label: "Nice-to-have", color: "var(--gray-3)", ring: "var(--gray-3)" },
}

// Minimum region size so hovering a point marker still reveals a visible
// highlight box around the section it points to.
const MIN_BOX = 0.08

export function ResultView({
  result,
  imageUrl,
  items,
  currentId,
  onNavigate,
  onBack,
  onMoveAnnotation,
  onResizeAnnotation,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  // Tiers the user has toggled off; their markers and cards are hidden.
  const [hiddenTiers, setHiddenTiers] = useState<Set<Tier>>(new Set())
  const cardRefs = useRef<Record<number, HTMLLIElement | null>>({})
  // Which card was just copied, to show a brief confirmation on its button.
  const [copiedNumber, setCopiedNumber] = useState<number | null>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Drag-to-reposition state. `dragPos` holds the live position of the marker
  // being dragged so it moves smoothly; it's committed to the parent on release.
  const imageBoxRef = useRef<HTMLDivElement | null>(null)
  const [dragPos, setDragPos] = useState<{ number: number; x: number; y: number } | null>(null)
  const dragRef = useRef<{
    number: number
    startX: number
    startY: number
    moved: boolean
    x: number
    y: number
  } | null>(null)

  // Resize-region state. `resizePos` holds the live box geometry while a handle
  // is being dragged; it's committed to the parent on release.
  const [resizePos, setResizePos] = useState<{
    number: number
    x: number
    y: number
    w: number
    h: number
  } | null>(null)
  const resizeRef = useRef<{
    number: number
    edge: Edge
    // base geometry captured at grab time
    bx: number
    by: number
    bw: number
    bh: number
    // latest committed geometry
    x: number
    y: number
    w: number
    h: number
  } | null>(null)

  // The annotation whose region should be revealed: hover takes priority.
  const active = hovered ?? selected

  // Reset transient state when switching between analyzed artifacts.
  useEffect(() => {
    setSelected(null)
    setHovered(null)
    setDragPos(null)
    dragRef.current = null
    setResizePos(null)
    resizeRef.current = null
  }, [currentId])

  // Clear any pending copy-confirmation timer on unmount.
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  const handleCopy = async (a: AnalysisResult["annotations"][number]) => {
    const text = [
      `[${TIER_META[a.tier].label} · ${a.skill}]`,
      a.observation,
      "",
      a.rationale,
      "",
      `Suggested action: ${a.suggested_action}`,
    ].join("\n")
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for environments without the async clipboard API.
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand("copy")
      } catch {
        // ignore — nothing more we can do
      }
      document.body.removeChild(ta)
    }
    setCopiedNumber(a.number)
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    copyTimeoutRef.current = setTimeout(() => setCopiedNumber(null), 1600)
  }

  const DRAG_THRESHOLD = 3 // px of movement before a press becomes a drag

  const toNormalized = (clientX: number, clientY: number) => {
    const box = imageBoxRef.current
    if (!box) return null
    const rect = box.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    }
  }

  const handlePointerDown = (e: React.PointerEvent, number: number) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // capture is best-effort; dragging still works via the move/up handlers
    }
    const start = toNormalized(e.clientX, e.clientY)
    dragRef.current = {
      number,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      x: start?.x ?? 0,
      y: start?.y ?? 0,
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const st = dragRef.current
    if (!st) return
    if (!st.moved) {
      if (Math.abs(e.clientX - st.startX) < DRAG_THRESHOLD && Math.abs(e.clientY - st.startY) < DRAG_THRESHOLD)
        return
      st.moved = true
    }
    const pos = toNormalized(e.clientX, e.clientY)
    if (pos) {
      st.x = pos.x
      st.y = pos.y
      setDragPos({ number: st.number, x: pos.x, y: pos.y })
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const st = dragRef.current
    if (!st) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // pointer capture may already be released
    }
    if (st.moved) {
      onMoveAnnotation(st.number, st.x, st.y)
    } else {
      // Treated as a click: select the marker.
      setSelected(st.number)
    }
    dragRef.current = null
    setDragPos(null)
  }

  // Keep the box within the image and above a minimum size.
  const clampBox = (x: number, y: number, w: number, h: number) => {
    const cw = Math.min(1, Math.max(MIN_BOX, w))
    const ch = Math.min(1, Math.max(MIN_BOX, h))
    return {
      w: cw,
      h: ch,
      x: Math.min(1 - cw / 2, Math.max(cw / 2, x)),
      y: Math.min(1 - ch / 2, Math.max(ch / 2, y)),
    }
  }

  const handleResizeDown = (
    e: React.PointerEvent,
    number: number,
    edge: Edge,
    geom: { x: number; y: number; w: number; h: number },
  ) => {
    e.stopPropagation()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // capture is best-effort
    }
    // Selecting keeps the box/handles visible even if the pointer leaves the marker.
    setSelected(number)
    resizeRef.current = {
      number,
      edge,
      bx: geom.x,
      by: geom.y,
      bw: geom.w,
      bh: geom.h,
      x: geom.x,
      y: geom.y,
      w: geom.w,
      h: geom.h,
    }
    setResizePos({ number, ...geom })
  }

  const handleResizeMove = (e: React.PointerEvent) => {
    const st = resizeRef.current
    if (!st) return
    const pos = toNormalized(e.clientX, e.clientY)
    if (!pos) return
    const { bx, by, bw, bh, edge } = st
    const symmetric = e.shiftKey
    let x = bx
    let y = by
    let w = bw
    let h = bh

    if (edge === "right") {
      if (symmetric) {
        w = 2 * Math.abs(pos.x - bx)
      } else {
        const left = bx - bw / 2
        w = pos.x - left
        x = (left + pos.x) / 2
      }
    } else if (edge === "left") {
      if (symmetric) {
        w = 2 * Math.abs(bx - pos.x)
      } else {
        const right = bx + bw / 2
        w = right - pos.x
        x = (pos.x + right) / 2
      }
    } else if (edge === "bottom") {
      if (symmetric) {
        h = 2 * Math.abs(pos.y - by)
      } else {
        const top = by - bh / 2
        h = pos.y - top
        y = (top + pos.y) / 2
      }
    } else if (edge === "top") {
      if (symmetric) {
        h = 2 * Math.abs(by - pos.y)
      } else {
        const bottom = by + bh / 2
        h = bottom - pos.y
        y = (pos.y + bottom) / 2
      }
    }

    // Symmetric resize keeps the center fixed.
    if (symmetric) {
      x = bx
      y = by
    }

    const clamped = clampBox(x, y, w, h)
    st.x = clamped.x
    st.y = clamped.y
    st.w = clamped.w
    st.h = clamped.h
    setResizePos({ number: st.number, ...clamped })
  }

  const handleResizeUp = (e: React.PointerEvent) => {
    const st = resizeRef.current
    if (!st) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // pointer capture may already be released
    }
    onResizeAnnotation(st.number, st.x, st.y, st.w, st.h)
    resizeRef.current = null
    setResizePos(null)
  }

  const toggleTier = (tier: Tier) => {
    setHiddenTiers((prev) => {
      const next = new Set(prev)
      if (next.has(tier)) next.delete(tier)
      else next.add(tier)
      return next
    })
  }

  const visibleAnnotations = result.annotations.filter((a) => !hiddenTiers.has(a.tier))

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
        <ul className="flex items-center gap-2">
          {(Object.keys(TIER_META) as Tier[]).map((t) => {
            const hidden = hiddenTiers.has(t)
            const count = result.annotations.filter((a) => a.tier === t).length
            return (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => toggleTier(t)}
                  aria-pressed={!hidden}
                  title={hidden ? `Show ${TIER_META[t].label}` : `Hide ${TIER_META[t].label}`}
                  className={`flex items-center gap-1.5 border px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tr-orange focus-visible:ring-offset-1 ${
                    hidden ? "border-gray-2 opacity-45 hover:opacity-70" : "border-gray-2 hover:bg-gray-1"
                  }`}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: hidden ? "transparent" : TIER_META[t].color,
                      boxShadow: hidden ? `inset 0 0 0 1.5px ${TIER_META[t].color}` : undefined,
                    }}
                    aria-hidden
                  />
                  <span className="text-xs font-medium text-gray-4">
                    {TIER_META[t].label}
                    {count > 0 && <span className="ml-1 tabular-nums text-gray-3">{count}</span>}
                  </span>
                </button>
              </li>
            )
          })}
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
          <div
            ref={imageBoxRef}
            className="relative inline-block w-full select-none border border-gray-2 bg-gray-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl || "/placeholder.svg"} alt="Analyzed design artifact" className="block w-full" />
            <div className="pointer-events-none absolute inset-0">
              {visibleAnnotations.map((a) => {
                const meta = TIER_META[a.tier]
                const isActive = active === a.number
                // Use the live drag position for the marker being dragged.
                const dp = dragPos && dragPos.number === a.number ? dragPos : null
                const isDragging = dp != null
                // Use the live resize geometry for the box being resized.
                const rz = resizePos && resizePos.number === a.number ? resizePos : null
                const isResizing = rz != null
                const posX = rz ? rz.x : dp ? dp.x : a.location.x
                const posY = rz ? rz.y : dp ? dp.y : a.location.y
                // Enforce a minimum visible region so point markers still get a box.
                const boxW = rz ? rz.w : Math.max(a.location.w, MIN_BOX)
                const boxH = rz ? rz.h : Math.max(a.location.h, MIN_BOX)
                const boxGeom = { x: posX, y: posY, w: boxW, h: boxH }
                const showBox = isActive || isDragging || isResizing
                const showHandles = (isActive || isResizing) && !isDragging
                const handles: { edge: Edge; left: string; top: string; cursor: string }[] = [
                  { edge: "left", left: "0%", top: "50%", cursor: "ew-resize" },
                  { edge: "right", left: "100%", top: "50%", cursor: "ew-resize" },
                  { edge: "top", left: "50%", top: "0%", cursor: "ns-resize" },
                  { edge: "bottom", left: "50%", top: "100%", cursor: "ns-resize" },
                ]
                return (
                  <div key={a.number}>
                    {/* Region box follows the marker while hovered/selected/dragging */}
                    {showBox && (
                      <div
                        className="absolute border-2 border-dashed"
                        style={{
                          left: `${(posX - boxW / 2) * 100}%`,
                          top: `${(posY - boxH / 2) * 100}%`,
                          width: `${boxW * 100}%`,
                          height: `${boxH * 100}%`,
                          borderColor: meta.color,
                          zIndex: 2,
                        }}
                      >
                        {showHandles &&
                          handles.map((hd) => (
                            <button
                              key={hd.edge}
                              type="button"
                              onPointerDown={(e) => handleResizeDown(e, a.number, hd.edge, boxGeom)}
                              onPointerMove={handleResizeMove}
                              onPointerUp={handleResizeUp}
                              aria-label={`Resize region ${hd.edge} edge. Hold Shift to resize both sides.`}
                              className="pointer-events-auto absolute h-2.5 w-2.5 touch-none border bg-white"
                              style={{
                                left: hd.left,
                                top: hd.top,
                                transform: "translate(-50%, -50%)",
                                borderColor: meta.color,
                                cursor: hd.cursor,
                                zIndex: 4,
                              }}
                            />
                          ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onPointerDown={(e) => handlePointerDown(e, a.number)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onMouseEnter={() => setHovered(a.number)}
                      onMouseLeave={() => setHovered(null)}
                      aria-label={`Annotation ${a.number}: ${meta.label}. Drag to reposition.`}
                      className={`pointer-events-auto absolute flex touch-none items-center justify-center rounded-full font-bold text-white ${
                        isDragging ? "cursor-grabbing" : "cursor-grab"
                      }`}
                      style={{
                        left: `${posX * 100}%`,
                        top: `${posY * 100}%`,
                        width: "28px",
                        height: "28px",
                        transform: `translate(-50%, -50%) scale(${isActive || isDragging ? 1.25 : 1})`,
                        backgroundColor: meta.color,
                        boxShadow:
                          isActive || isDragging ? "0 0 0 3px #fff, 0 0 0 5px " + meta.color : "0 0 0 2px #fff",
                        fontSize: "13px",
                        zIndex: isActive || isDragging ? 3 : 1,
                        transition: isDragging ? "none" : "transform 120ms",
                      }}
                    >
                      {a.number}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          <p className="mt-2 text-[11px] text-gray-3">
            AI places markers approximately — drag a circle to move it, or drag the edge handles to resize its
            region (hold Shift to resize both sides).
          </p>
        </div>

        {/* Right: comment cards */}
        <ul className="flex flex-col gap-3">
          {visibleAnnotations.length === 0 && (
            <li className="border border-dashed border-gray-2 p-6 text-center text-sm text-gray-4">
              All categories hidden. Toggle a category above to show its feedback.
            </li>
          )}
          {visibleAnnotations.map((a) => {
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          void handleCopy(a)
                        }}
                        aria-label={`Copy feedback ${a.number} to clipboard`}
                        title="Copy feedback"
                        className="ml-auto inline-flex items-center gap-1 border border-gray-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-gray-4 transition-colors hover:border-racing-green hover:text-racing-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tr-orange focus-visible:ring-offset-1"
                      >
                        {copiedNumber === a.number ? (
                          <>
                            <Check className="h-3 w-3" aria-hidden />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" aria-hidden />
                            Copy
                          </>
                        )}
                      </button>
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
