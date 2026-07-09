"use client"

import { useCallback, useRef, useState } from "react"
import { Upload, X } from "lucide-react"
import type { Artifact } from "@/lib/types"
import { uid } from "@/lib/storage"

interface Props {
  artifacts: Artifact[]
  activeId: string | null
  onAdd: (artifacts: Artifact[]) => void
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onFigmaChange: (id: string, link: string) => void
}

function readFiles(files: FileList | File[]): Promise<Artifact[]> {
  const images = Array.from(files).filter((f) => f.type.startsWith("image/"))
  return Promise.all(
    images.map(
      (file) =>
        new Promise<Artifact>((resolve) => {
          const reader = new FileReader()
          reader.onload = () =>
            resolve({
              id: uid(),
              name: file.name,
              dataUrl: reader.result as string,
              figmaLink: "",
            })
          reader.readAsDataURL(file)
        }),
    ),
  )
}

export function ArtifactIntake({
  artifacts,
  activeId,
  onAdd,
  onSelect,
  onRemove,
  onFigmaChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const next = await readFiles(files)
      if (next.length) onAdd(next)
    },
    [onAdd],
  )

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
        <Upload className="h-6 w-6 text-gray-3" aria-hidden />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-semibold text-graphite underline decoration-gray-3 underline-offset-4 hover:decoration-tr-orange"
        >
          Click to upload
        </button>
        <p className="text-sm text-gray-4">or drag and drop an image (PNG / JPG)</p>
        <p className="max-w-xs text-[11px] leading-relaxed text-gray-3">
          Export PDF pages and Figma frames as images before uploading.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
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

      {/* Per-artifact Figma link */}
      {active && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="figma-link"
            className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray-4"
          >
            Figma frame link (optional)
          </label>
          <input
            id="figma-link"
            type="url"
            value={active.figmaLink}
            onChange={(e) => onFigmaChange(active.id, e.target.value)}
            placeholder="https://figma.com/file/…"
            className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
          />
        </div>
      )}
    </section>
  )
}
