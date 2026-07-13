"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"
import {
  Clipboard,
  Eye,
  ImageIcon,
  LayoutGrid,
  List,
  Loader2,
  MoreVertical,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react"
import type { Artifact } from "@/lib/types"
import { uid } from "@/lib/storage"
import { isImage, isPdf, pdfToImages } from "@/lib/file-extract"
import { InfoTooltip } from "@/components/session/info-tooltip"
import { ArtifactPreview } from "@/components/session/artifact-preview"

type ViewMode = "cards" | "list"

interface Props {
  artifacts: Artifact[]
  // Ids currently selected for analysis (one or many).
  selectedIds: string[]
  // Ids of artifacts that have a completed AI analysis, used to badge cards.
  analyzedIds: string[]
  // Number of recommendations (annotations) per artifact id.
  recommendationCounts: Record<string, number>
  onAdd: (artifacts: Artifact[]) => void
  onSelectionChange: (ids: string[]) => void
  onRemove: (id: string) => void
  onRemoveAll: () => void
  onViewAnalysis: (id: string) => void
  onAnalyze: (ids: string[]) => void
  // When true, hides per-artifact selection and inline analysis actions. Used
  // by the stepped flow, where the whole uploaded set is the batch and
  // analysis is gated behind the wizard's dedicated steps.
  wizard?: boolean
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

// Turn uploaded files into artifacts. Images map 1:1; PDFs are rendered to one
// image artifact per page so the annotation overlay keeps working.
async function readFiles(files: FileList | File[]): Promise<Artifact[]> {
  const out: Artifact[] = []
  for (const file of Array.from(files)) {
    if (isImage(file)) {
      out.push({ id: uid(), name: file.name, dataUrl: await readImage(file) })
    } else if (isPdf(file)) {
      const pages = await pdfToImages(file)
      for (const p of pages) out.push({ id: uid(), name: p.name, dataUrl: p.dataUrl })
    }
  }
  return out
}

export function ArtifactIntake({
  artifacts,
  selectedIds,
  analyzedIds,
  recommendationCounts,
  onAdd,
  onSelectionChange,
  onRemove,
  onRemoveAll,
  onViewAnalysis,
  onAnalyze,
  wizard = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [pasteHint, setPasteHint] = useState<string | null>(null)

  // Which card's context menu is open.
  const [menuId, setMenuId] = useState<string | null>(null)
  // Index of the artifact shown in the full-screen preview (null = closed).
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  // Cards (grid) vs. list layout, like Google Docs.
  const [viewMode, setViewMode] = useState<ViewMode>("cards")

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setPasteHint(null)
      setProcessing(true)
      try {
        const next = await readFiles(files)
        if (next.length) onAdd(next)
      } catch {
        setPasteHint("Couldn't read that file. Try a PNG, JPG, or PDF.")
      } finally {
        setProcessing(false)
      }
    },
    [onAdd],
  )

  // Global Cmd/Ctrl+V paste: pull images out of the clipboard event.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      // Don't hijack paste while typing into a text field.
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT")) return

      const files = Array.from(e.clipboardData?.items ?? [])
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null)

      if (files.length) {
        e.preventDefault()
        void handleFiles(files)
      }
    }
    document.addEventListener("paste", onPaste)
    return () => document.removeEventListener("paste", onPaste)
  }, [handleFiles])

  // Explicit button using the async Clipboard API (for browsers/contexts where
  // it's available and permitted).
  const handleClipboardButton = useCallback(async () => {
    setPasteHint(null)
    try {
      if (!navigator.clipboard?.read) {
        setPasteHint("Clipboard access isn't available here — try Cmd/Ctrl+V instead.")
        return
      }
      const items = await navigator.clipboard.read()
      const files: File[] = []
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith("image/"))
        if (type) {
          const blob = await item.getType(type)
          files.push(new File([blob], `pasted-${uid()}.${type.split("/")[1] || "png"}`, { type }))
        }
      }
      if (files.length) {
        await handleFiles(files)
      } else {
        setPasteHint("No image found on the clipboard.")
      }
    } catch {
      setPasteHint("Couldn't read the clipboard — try Cmd/Ctrl+V instead.")
    }
  }, [handleFiles])

  // Close any open context menu on outside click or Escape.
  useEffect(() => {
    if (!menuId) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target && target.closest("[data-card-menu]")) return
      setMenuId(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuId(null)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [menuId])

  // Click selects a single card; Cmd/Ctrl-click toggles it in the selection.
  // In wizard mode selection is disabled, so a click opens the preview instead.
  const handleCardClick = (e: ReactMouseEvent, id: string, index: number) => {
    if (wizard) {
      setPreviewIndex(index)
      return
    }
    if (e.metaKey || e.ctrlKey) {
      const set = new Set(selectedIds)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      onSelectionChange(artifacts.filter((a) => set.has(a.id)).map((a) => a.id))
    } else {
      onSelectionChange([id])
    }
  }

  // Shared overflow menu for both card and list layouts.
  const renderMenu = (a: Artifact, index: number, isAnalyzed: boolean) => (
    <div className="relative" data-card-menu>
      <button
        type="button"
        onClick={() => setMenuId((prev) => (prev === a.id ? null : a.id))}
        aria-label={`More actions for ${a.name}`}
        aria-haspopup="menu"
        aria-expanded={menuId === a.id}
        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-4 transition-colors hover:bg-gray-2 hover:text-graphite"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>
      {menuId === a.id && (
        <div
          role="menu"
          className="absolute right-0 top-8 z-10 w-44 overflow-hidden rounded-md border border-gray-2 bg-white py-1 shadow-lg"
        >
          {!wizard && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuId(null)
                onAnalyze([a.id])
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-graphite hover:bg-gray-1"
            >
              <Sparkles className="h-3.5 w-3.5 text-tr-orange" aria-hidden />
              {isAnalyzed ? "Re-analyze this" : "Analyze this"}
            </button>
          )}
          {!wizard && selectedIds.length > 1 && selectedIds.includes(a.id) && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuId(null)
                onAnalyze(selectedIds)
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-graphite hover:bg-gray-1"
            >
              <Sparkles className="h-3.5 w-3.5 text-tr-orange" aria-hidden />
              Analyze selected ({selectedIds.length})
            </button>
          )}
          {!wizard && isAnalyzed && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuId(null)
                onViewAnalysis(a.id)
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-racing-green hover:bg-gray-1"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
              View analysis
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuId(null)
              setPreviewIndex(index)
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-graphite hover:bg-gray-1"
          >
            <ImageIcon className="h-3.5 w-3.5 text-gray-4" aria-hidden />
            Preview
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuId(null)
              onRemove(a.id)
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-tr-red hover:bg-gray-1"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Remove
          </button>
        </div>
      )}
    </div>
  )

  const allSelected = artifacts.length > 0 && selectedIds.length === artifacts.length

  return (
    <section aria-labelledby="artifact-heading" className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <h2
          id="artifact-heading"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
        >
          Design Artifacts
        </h2>
        <InfoTooltip label="About artifacts">
          Upload the design you want reviewed — a screen, flow, or mockup as PNG, JPG, or PDF. Clear,
          full-resolution exports produce the most accurate annotations.
        </InfoTooltip>
        {artifacts.length > 0 && (
          <span className="ml-auto flex items-center gap-2 text-[11px] font-medium tabular-nums text-gray-4">
            <span>
              {artifacts.length} {artifacts.length === 1 ? "image" : "images"}
            </span>
            {analyzedIds.length > 0 && (
              <span className="inline-flex items-center gap-1 text-racing-green">
                <Sparkles className="h-3 w-3" aria-hidden />
                {analyzedIds.length} analyzed
              </span>
            )}
          </span>
        )}
      </div>

      {/* Two-column: dropzone (left, 1fr) + gallery / blank state (right, 2fr) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-8">
      {/* Left: drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-10 text-center transition-colors lg:max-h-[460px] lg:self-stretch ${
          dragging ? "border-tr-orange bg-gray-1" : "border-gray-2 bg-white"
        }`}
      >
        {processing ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-gray-3" aria-hidden />
            <p role="status" className="text-sm text-gray-4">
              Processing file…
            </p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-gray-3" aria-hidden />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm font-semibold text-graphite underline decoration-gray-3 underline-offset-4 hover:decoration-tr-orange"
            >
              Click to upload
            </button>
            <p className="text-sm text-gray-4">or drag and drop — PNG, JPG, or PDF</p>
            <p className="mt-1 text-[11px] text-gray-3">
              <button
                type="button"
                onClick={handleClipboardButton}
                className="inline-flex items-center gap-1 text-gray-4 underline decoration-gray-2 underline-offset-2 transition-colors hover:text-tr-orange hover:decoration-tr-orange"
              >
                <Clipboard className="h-3 w-3" aria-hidden />
                Paste image
              </button>
              <span className="text-gray-3"> or press Cmd/Ctrl+V</span>
            </p>
            {pasteHint && (
              <p role="status" className="max-w-xs text-[11px] leading-relaxed text-tr-red">
                {pasteHint}
              </p>
            )}
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,application/pdf,.pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            // Copy File objects out before resetting the input's value, so
            // clearing the field can't empty the FileList we're about to read.
            const picked = e.target.files ? Array.from(e.target.files) : []
            e.target.value = ""
            if (picked.length) handleFiles(picked)
          }}
        />
      </div>

      {/* Right: blank state when no images yet */}
      {artifacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-gray-2 px-4 py-10 text-center">
          <ImageIcon className="h-6 w-6 text-gray-3" aria-hidden />
          <p className="text-sm font-medium text-graphite">No designs added yet</p>
          <p className="max-w-[260px] text-xs leading-relaxed text-gray-4">
            Uploaded designs will appear here. Add a screen, flow, or mockup on the left to get
            started.
          </p>
        </div>
      ) : (
        /* Right: toolbar + artifacts */
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[11px] font-medium">
            {artifacts.length > 1 && (
              <>
                {!wizard && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        onSelectionChange(allSelected ? [] : artifacts.map((a) => a.id))
                      }
                      className="text-graphite underline decoration-gray-3 underline-offset-2 transition-colors hover:decoration-tr-orange"
                    >
                      {allSelected ? "Deselect all" : "Select all"}
                    </button>
                    <span aria-hidden className="text-gray-2">
                      |
                    </span>
                  </>
                )}
                <button
                  type="button"
                  onClick={onRemoveAll}
                  className="inline-flex items-center gap-1 text-tr-red underline decoration-transparent underline-offset-2 transition-colors hover:decoration-tr-red"
                >
                  <Trash2 className="h-3 w-3" aria-hidden />
                  Remove all
                </button>
              </>
            )}

            {/* Cards / list view toggle */}
            <div
              role="group"
              aria-label="View mode"
              className="ml-auto inline-flex items-center rounded-full border border-gray-2 bg-white p-0.5"
            >
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                aria-label="List view"
                className={`flex h-6 w-8 items-center justify-center rounded-full transition-colors ${
                  viewMode === "list"
                    ? "bg-racing-green text-white"
                    : "text-gray-4 hover:text-graphite"
                }`}
              >
                <List className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                aria-pressed={viewMode === "cards"}
                aria-label="Card view"
                className={`flex h-6 w-8 items-center justify-center rounded-full transition-colors ${
                  viewMode === "cards"
                    ? "bg-racing-green text-white"
                    : "text-gray-4 hover:text-graphite"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>

          {viewMode === "cards" ? (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {artifacts.map((a, index) => {
                const isSelected = selectedIds.includes(a.id)
                const isAnalyzed = analyzedIds.includes(a.id)
                const recCount = recommendationCounts[a.id] ?? 0
                return (
                  <li key={a.id}>
                    <div
                      className={`flex flex-col overflow-hidden bg-white transition-colors ${
                        isSelected
                          ? "ring-2 ring-tr-orange"
                          : "ring-1 ring-gray-2 hover:ring-gray-3"
                      }`}
                    >
                      {/* Header: file icon, name, overflow menu */}
                      <div className="flex items-center gap-2 px-3 py-2">
                        <ImageIcon className="h-4 w-4 shrink-0 text-gray-4" aria-hidden />
                        <span
                          className="min-w-0 flex-1 truncate text-sm font-medium text-graphite"
                          title={a.name}
                        >
                          {a.name}
                        </span>
                        {renderMenu(a, index, isAnalyzed)}
                      </div>

                      {/* Preview area */}
                      <div className="relative m-3 mt-0">
                        <button
                          type="button"
                          onClick={(e) => handleCardClick(e, a.id, index)}
                          onDoubleClick={() => setPreviewIndex(index)}
                          aria-pressed={wizard ? undefined : isSelected}
                          aria-label={
                            wizard
                              ? `Preview artifact ${a.name}`
                              : `Select artifact ${a.name}${isAnalyzed ? " (analyzed)" : ""}`
                          }
                          className="block aspect-[4/3] w-full overflow-hidden border border-gray-2 bg-white"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.dataUrl || "/placeholder.svg"}
                            alt={a.name}
                            className="h-full w-full object-contain"
                          />
                        </button>
                        {isAnalyzed && (
                          <button
                            type="button"
                            onClick={() => onViewAnalysis(a.id)}
                            title="View analysis"
                            className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-racing-green px-2 py-1 text-[10px] font-semibold tabular-nums text-white shadow-sm transition-colors hover:bg-racing-green/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tr-orange focus-visible:ring-offset-1"
                          >
                            <Sparkles className="h-3 w-3" aria-hidden />
                            View Analysis
                            {recCount > 0 && ` (${recCount})`}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {artifacts.map((a, index) => {
                const isSelected = selectedIds.includes(a.id)
                const isAnalyzed = analyzedIds.includes(a.id)
                const recCount = recommendationCounts[a.id] ?? 0
                return (
                  <li key={a.id}>
                    <div
                      className={`flex items-center gap-3 bg-white px-2 py-1.5 transition-colors ${
                        isSelected
                          ? "ring-2 ring-tr-orange"
                          : "ring-1 ring-gray-2 hover:ring-gray-3"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleCardClick(e, a.id, index)}
                        onDoubleClick={() => setPreviewIndex(index)}
                        aria-pressed={wizard ? undefined : isSelected}
                        aria-label={
                          wizard
                            ? `Preview artifact ${a.name}`
                            : `Select artifact ${a.name}${isAnalyzed ? " (analyzed)" : ""}`
                        }
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className="relative block h-10 w-14 shrink-0 overflow-hidden border border-gray-2 bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.dataUrl || "/placeholder.svg"}
                            alt={a.name}
                            className="h-full w-full object-contain"
                          />
                        </span>
                        <span
                          className="min-w-0 flex-1 truncate text-sm font-medium text-graphite"
                          title={a.name}
                        >
                          {a.name}
                        </span>
                      </button>
                      {isAnalyzed && (
                        <button
                          type="button"
                          onClick={() => onViewAnalysis(a.id)}
                          title="View analysis"
                          className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium tabular-nums text-racing-green transition-colors hover:bg-racing-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tr-orange"
                        >
                          <Sparkles className="h-3 w-3" aria-hidden />
                          View Analysis
                          {recCount > 0 && ` (${recCount})`}
                        </button>
                      )}
                      {renderMenu(a, index, isAnalyzed)}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <p className="text-[11px] text-gray-3">
            {wizard
              ? "Every image you add here is analyzed together with the same context and skill. Click an image to preview it, or use the ⋮ menu to remove."
              : "Click to select · Cmd/Ctrl-click to select multiple · use the ⋮ menu to analyze, view, preview, or remove."}
          </p>
        </div>
      )}
      </div>

      {/* Full-screen preview */}
      {previewIndex !== null && artifacts[previewIndex] && (
        <ArtifactPreview
          artifacts={artifacts}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </section>
  )
}
