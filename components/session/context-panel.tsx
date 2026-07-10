"use client"

import { useRef, useState } from "react"
import { Eye, Loader2, Pencil, Trash2, Upload } from "lucide-react"
import type { SavedContext } from "@/lib/types"
import { extractTextFromFile } from "@/lib/file-extract"

interface Props {
  contextText: string
  onContextChange: (text: string) => void
  contexts: SavedContext[]
  onSave: (name: string, text: string) => void
  onUpdate: (id: string, name: string, text: string) => void
  onRemove: (id: string) => void
}

export function ContextPanel({
  contextText,
  onContextChange,
  contexts,
  onSave,
  onUpdate,
  onRemove,
}: Props) {
  const [name, setName] = useState("")
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editText, setEditText] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed || !contextText.trim()) return
    onSave(trimmed, contextText)
    setName("")
  }

  // Extract text from an uploaded file and append it to the current context.
  const handleImportFiles = async (files: File[]) => {
    if (!files.length) return
    setImportError(null)
    setImporting(true)
    try {
      const texts: string[] = []
      for (const file of files) {
        const text = await extractTextFromFile(file)
        if (text) texts.push(text)
      }
      const extracted = texts.join("\n\n").trim()
      if (!extracted) {
        setImportError("No readable text found in that file.")
        return
      }
      const combined = contextText.trim() ? `${contextText.trim()}\n\n${extracted}` : extracted
      onContextChange(combined)
    } catch {
      setImportError("Couldn't read that file. Supported: PDF, TXT, DOCX.")
    } finally {
      setImporting(false)
    }
  }

  const startEdit = (c: SavedContext) => {
    setPreviewId(null)
    setEditId(c.id)
    setEditName(c.name)
    setEditText(c.text)
  }

  return (
    <section aria-labelledby="context-heading" className="flex flex-col gap-4">
      <h2
        id="context-heading"
        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
      >
        Project &amp; product context
      </h2>

      <textarea
        value={contextText}
        onChange={(e) => onContextChange(e.target.value)}
        rows={6}
        placeholder="Paste background, target users, prior research, known constraints..."
        className="ds-scroll resize-y border border-gray-2 bg-white px-3 py-2 text-sm leading-relaxed text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
      />

      {/* Import context from a file */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="inline-flex items-center gap-1.5 border border-gray-2 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-graphite transition-colors hover:border-tr-orange hover:text-tr-orange disabled:cursor-not-allowed disabled:text-gray-3"
        >
          {importing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-3.5 w-3.5" aria-hidden />
          )}
          {importing ? "Reading…" : "Upload file"}
        </button>
        <span className="text-[11px] text-gray-3">Appends text from PDF, TXT, or Word</span>
        {importError && (
          <p role="status" className="w-full text-[11px] leading-relaxed text-tr-red">
            {importError}
          </p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          className="sr-only"
          onChange={(e) => {
            const picked = e.target.files ? Array.from(e.target.files) : []
            e.target.value = ""
            void handleImportFiles(picked)
          }}
        />
      </div>

      {/* Save current draft as a named entry */}
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this context"
          aria-label="Context name"
          className="flex-1 border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || !contextText.trim()}
          className="shrink-0 border border-racing-green bg-white px-4 py-2 text-sm font-semibold text-racing-green transition-colors hover:bg-racing-green hover:text-white disabled:cursor-not-allowed disabled:border-gray-2 disabled:text-gray-3 disabled:hover:bg-white"
        >
          Save
        </button>
      </div>

      {/* Saved contexts list */}
      {contexts.length > 0 && (
        <ul className="flex flex-col divide-y divide-gray-2 border border-gray-2">
          {contexts.map((c) => {
            const isPreview = previewId === c.id
            const isEdit = editId === c.id
            return (
              <li key={c.id} className="flex flex-col">
                <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => onContextChange(c.text)}
                    className="truncate text-left text-sm font-medium text-graphite hover:text-tr-orange"
                    title="Load into editor"
                  >
                    {c.name}
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <IconBtn
                      label="Preview"
                      onClick={() => {
                        setEditId(null)
                        setPreviewId(isPreview ? null : c.id)
                      }}
                      active={isPreview}
                    >
                      <Eye className="h-4 w-4" aria-hidden />
                    </IconBtn>
                    <IconBtn
                      label="Edit"
                      onClick={() => (isEdit ? setEditId(null) : startEdit(c))}
                      active={isEdit}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </IconBtn>
                    <IconBtn label="Delete" onClick={() => onRemove(c.id)} danger>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </IconBtn>
                  </div>
                </div>

                {/* Inline preview */}
                {isPreview && (
                  <div className="border-t border-gray-2 bg-gray-1 px-3 py-3">
                    <p className="ds-scroll max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-graphite">
                      {c.text}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewId(null)}
                        className="border border-gray-2 bg-white px-3 py-1.5 text-xs font-semibold text-gray-4 hover:border-gray-3"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onContextChange(c.text)
                          setPreviewId(null)
                        }}
                        className="border border-racing-green bg-white px-3 py-1.5 text-xs font-semibold text-racing-green hover:bg-racing-green hover:text-white"
                      >
                        Load into editor
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline edit */}
                {isEdit && (
                  <div className="flex flex-col gap-2 border-t border-gray-2 bg-gray-1 px-3 py-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      aria-label="Edit context name"
                      className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none focus:border-racing-green"
                    />
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={5}
                      aria-label="Edit context text"
                      className="ds-scroll resize-y border border-gray-2 bg-white px-3 py-2 text-sm leading-relaxed text-graphite outline-none focus:border-racing-green"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditId(null)}
                        className="border border-gray-2 bg-white px-3 py-1.5 text-xs font-semibold text-gray-4 hover:border-gray-3"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!editName.trim()) return
                          onUpdate(c.id, editName.trim(), editText)
                          setEditId(null)
                        }}
                        className="border border-racing-green bg-racing-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-racing-green-light"
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  active,
  danger,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center border transition-colors ${
        active
          ? "border-racing-green bg-racing-green text-white"
          : danger
            ? "border-transparent text-gray-4 hover:border-tr-red hover:text-tr-red"
            : "border-transparent text-gray-4 hover:border-gray-3 hover:text-graphite"
      }`}
    >
      {children}
    </button>
  )
}
