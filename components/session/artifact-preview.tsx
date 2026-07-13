"use client"

import { useEffect } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import type { Artifact } from "@/lib/types"

interface Props {
  artifacts: Artifact[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

// Full-screen, Google Photos-style viewer for a single artifact with
// keyboard + on-screen navigation across the uploaded set.
export function ArtifactPreview({ artifacts, index, onIndexChange, onClose }: Props) {
  const current = artifacts[index]
  const hasPrev = index > 0
  const hasNext = index < artifacts.length - 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1)
      if (e.key === "ArrowRight" && index < artifacts.length - 1) onIndexChange(index + 1)
    }
    document.addEventListener("keydown", onKey)
    // Lock background scroll while the viewer is open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [index, artifacts.length, onClose, onIndexChange])

  if (!current) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${current.name}`}
      className="fixed inset-0 z-50 flex flex-col bg-white/60 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 text-graphite"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="min-w-0 truncate text-sm font-medium" title={current.name}>
          {current.name}
        </span>
        <span className="flex items-center gap-4">
          <span className="text-xs tabular-nums text-graphite/60">
            {index + 1} / {artifacts.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-9 w-9 items-center justify-center text-graphite/70 transition-colors hover:bg-graphite/10 hover:text-graphite"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </span>
      </div>

      {/* Image stage */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
        {hasPrev && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onIndexChange(index - 1)
            }}
            aria-label="Previous image"
            className="absolute left-4 flex h-11 w-11 items-center justify-center bg-graphite/10 text-graphite transition-colors hover:bg-graphite/20"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.dataUrl || "/placeholder.svg"}
          alt={current.name}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full object-contain"
        />

        {hasNext && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onIndexChange(index + 1)
            }}
            aria-label="Next image"
            className="absolute right-4 flex h-11 w-11 items-center justify-center bg-graphite/10 text-graphite transition-colors hover:bg-graphite/20"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
