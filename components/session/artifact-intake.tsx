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
  Loader2,
  MoreVertical,
  Pencil,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react"
import type { Artifact } from "@/lib/types"
import { uid } from "@/lib/storage"
import { isImage, isPdf, pdfToImages } from "@/lib/file-extract"
import { InfoTooltip } from "@/components/session/info-tooltip"
import { ArtifactPreview } from "@/components/session/artifact-preview"

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
  onRename: (id: string, name: string) => void
  onAnalyze: (ids: string[]) => void
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
  onRename,
  onAnalyze,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [pasteHint, setPasteHint] = useState<string | null>(null)

  // Which card's context menu is open.
  const [menuId, setMenuId] = useState<string | null>(null)
  // Which card is being renamed, plus its working value.
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  // Index of the artifact shown in the full-screen preview (null = closed).
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

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
  const handleCardClick = (e: ReactMouseEvent, id: string) => {
    if (renamingId === id) return
    if (e.metaKey || e.ctrlKey) {
      const set = new Set(selectedIds)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      onSelectionChange(artifacts.filter((a) => set.has(a.id)).map((a) => a.id))
    } else {
      onSelectionChange([id])
    }
  }

  const startRename = (a: Artifact) => {
    setMenuId(null)
    setRenamingId(a.id)
    setRenameValue(a.name)
  }

  const commitRename = () => {
    if (renamingId) onRename(renamingId, renameValue)
    setRenamingId(null)
    setRenameValue("")
  }

  return (
    <section aria-labelledby="artifact-heading" className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <h2
          id="artifact-heading"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
        >
          Artifact
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

      {/* Drop zone */}
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
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-10 text-center transition-colors ${
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

      {/* Card grid */}
      {artifacts.length > 0 && (
        <div className="flex flex-col gap-2">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {artifacts.map((a, index) => {
              const isSelected = selectedIds.includes(a.id)
              const isAnalyzed = analyzedIds.includes(a.id)
              const recCount = recommendationCounts[a.id] ?? 0
              const isRenaming = renamingId === a.id
              return (
                <li key={a.id}>
                  <div
                    className={`flex flex-col overflow-hidden rounded-lg bg-gray-1 transition-colors ${
                      isSelected
                        ? "ring-2 ring-tr-orange"
                        : "ring-1 ring-gray-2 hover:ring-gray-3"
                    }`}
                  >
                    {/* Header: file icon, name, overflow menu */}
                    <div className="flex items-center gap-2 px-3 py-2">
                      <ImageIcon className="h-4 w-4 shrink-0 text-gray-4" aria-hidden />
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename()
                            if (e.key === "Escape") {
                              setRenamingId(null)
                              setRenameValue("")
                            }
                          }}
                          aria-label={`Rename ${a.name}`}
                          className="min-w-0 flex-1 border-b border-tr-orange bg-transparent text-sm font-medium text-graphite outline-none"
                        />
                      ) : (
                        <span
                          className="min-w-0 flex-1 truncate text-sm font-medium text-graphite"
                          title={a.name}
                        >
                          {a.name}
                        </span>
                      )}

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
                            className="absolute right-0 top-8 z-10 w-40 overflow-hidden rounded-md border border-gray-2 bg-white py-1 shadow-lg"
                          >
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
                              Analyze this
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setMenuId(null)
                                setPreviewIndex(index)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-graphite hover:bg-gray-1"
                            >
                              <Eye className="h-3.5 w-3.5 text-gray-4" aria-hidden />
                              Preview
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => startRename(a)}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-graphite hover:bg-gray-1"
                            >
                              <Pencil className="h-3.5 w-3.5 text-gray-4" aria-hidden />
                              Rename
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
                    </div>

                    {/* Preview area */}
                    <button
                      type="button"
                      onClick={(e) => handleCardClick(e, a.id)}
                      onDoubleClick={() => setPreviewIndex(index)}
                      aria-pressed={isSelected}
                      aria-label={`Select artifact ${a.name}${isAnalyzed ? " (analyzed)" : ""}`}
                      className="relative m-3 mt-0 block aspect-[4/3] overflow-hidden rounded bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.dataUrl || "/placeholder.svg"}
                        alt={a.name}
                        className="h-full w-full object-contain"
                      />
                      {isAnalyzed && recCount > 0 && (
                        <span
                          title={`${recCount} ${recCount === 1 ? "recommendation" : "recommendations"}`}
                          className="pointer-events-none absolute left-2 top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-white bg-tr-orange px-1 text-[10px] font-semibold leading-none tabular-nums text-white shadow-sm"
                        >
                          {recCount}
                          <span className="sr-only"> recommendations</span>
                        </span>
                      )}
                      {isAnalyzed && (
                        <span
                          aria-hidden
                          title="Analyzed by AI"
                          className="absolute bottom-2 left-2 inline-flex items-center gap-0.5 rounded bg-racing-green px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-white"
                        >
                          <Sparkles className="h-2.5 w-2.5" aria-hidden />
                          AI
                        </span>
                      )}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="text-[11px] text-gray-3">
            Click to select · Cmd/Ctrl-click to select multiple · use the ⋮ menu to analyze, preview,
            rename, or remove.
          </p>
        </div>
      )}

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
