"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Clipboard, Loader2, Upload, X } from "lucide-react"
import type { Artifact } from "@/lib/types"
import { uid } from "@/lib/storage"
import { isImage, isPdf, pdfToImages } from "@/lib/file-extract"

interface Props {
  artifacts: Artifact[]
  activeId: string | null
  onAdd: (artifacts: Artifact[]) => void
  onSelect: (id: string) => void
  onRemove: (id: string) => void
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
  activeId,
  onAdd,
  onSelect,
  onRemove,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)

  const [pasteHint, setPasteHint] = useState<string | null>(null)

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

  const active = artifacts.find((a) => a.id === activeId) ?? null

  return (
    <section aria-labelledby="artifact-heading" className="flex flex-col gap-4">
      <h2
        id="artifact-heading"
        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
      >
        Artifact
      </h2>

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
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleClipboardButton}
                className="inline-flex items-center gap-1.5 border border-gray-2 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-graphite transition-colors hover:border-tr-orange hover:text-tr-orange"
              >
                <Clipboard className="h-3.5 w-3.5" aria-hidden />
                Paste image
              </button>
              <span className="text-[11px] text-gray-3">or press Cmd/Ctrl+V</span>
            </div>
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

      {/* Thumbnail strip */}
      {artifacts.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {artifacts.map((a) => {
            const isActive = a.id === activeId
            return (
              <li key={a.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(a.id)}
                  aria-pressed={isActive}
                  aria-label={`Select artifact ${a.name}`}
                  className={`block h-20 w-28 overflow-hidden bg-gray-1 ${
                    isActive
                      ? "border-2 border-tr-orange"
                      : "border border-gray-2 hover:border-gray-3"
                  }`}
                  style={{ aspectRatio: "28 / 20" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.dataUrl || "/placeholder.svg"}
                    alt={a.name}
                    className="h-full w-full object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(a.id)}
                  aria-label={`Remove ${a.name}`}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center border border-gray-2 bg-white text-graphite opacity-0 transition-opacity hover:border-tr-red hover:text-tr-red group-hover:opacity-100"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
