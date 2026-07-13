"use client"

import { useEffect, useRef, useState } from "react"
import { FileText, Info, Loader2, Lock, SlidersHorizontal, Trash2, Upload, X } from "lucide-react"
import type { SavedContext } from "@/lib/types"
import { extractTextFromFile } from "@/lib/file-extract"
import { InfoTooltip } from "@/components/session/info-tooltip"

interface Props {
  contextText: string
  onContextChange: (text: string) => void
  contexts: SavedContext[]
  onSave: (name: string, text: string) => void
  onUpdate: (id: string, name: string, text: string) => void
  onRemove: (id: string) => void
  /** Open Settings → Contexts to manage global entries. */
  onManageGlobal: () => void
}

// Global entries are managed in Settings; only "local" entries are editable here.
const isLocal = (c: SavedContext) => c.scope === "local"

export function ContextPanel({
  contextText,
  onContextChange,
  contexts,
  onSave,
  onUpdate,
  onRemove,
  onManageGlobal,
}: Props) {
  const [name, setName] = useState("")
  // The saved context whose details modal is open.
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const detailsContext = detailsId ? contexts.find((c) => c.id === detailsId) ?? null : null
  // Split so global (Settings-managed) contexts are grouped and easy to identify.
  const globalContexts = contexts.filter((c) => !isLocal(c))
  const localContexts = contexts.filter((c) => isLocal(c))
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed || !contextText.trim()) return
    onSave(trimmed, contextText)
    setName("")
    // Clear the editor so the user can immediately start a fresh context entry.
    onContextChange("")
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

  return (
    <section
      aria-labelledby="context-heading"
      className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8"
    >
      {/* Left: compose column (constrained for comfortable line length) */}
      <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <h2
          id="context-heading"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
        >
          Project &amp; product context
        </h2>
        <InfoTooltip label="About project context">
          Add target users, design goals, brand guidelines, or known constraints. The more relevant
          context you provide, the more tailored the analysis.
        </InfoTooltip>
      </div>

      <textarea
        value={contextText}
        onChange={(e) => onContextChange(e.target.value)}
        rows={6}
        aria-label="Project and product context"
        placeholder="e.g. Target users are busy Tax professionals who want save time during tax season by reducing redudant tasks; main goal is to focus in reviewing tax returns instead of wasting time entering data; must follow TR brand guidelines..."
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
      </div>

      {/* Right: saved contexts sidebar (always shown to balance the layout) */}
      <aside className="flex min-w-0 flex-col gap-2.5 lg:border-l lg:border-gray-2 lg:pl-8">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4">
          Saved Contexts
        </h3>

        {contexts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-gray-3 px-4 py-10 text-center">
            <FileText className="h-6 w-6 text-gray-3" aria-hidden />
            <p className="text-sm font-medium text-graphite">No saved contexts yet</p>
            <p className="max-w-[220px] text-xs leading-relaxed text-gray-4">
              Your saved contexts for this project will be placed here. You can also add global
              contexts that applies to any project under the Settings menu.
            </p>
          </div>
        ) : (
          <div className="ds-scroll flex flex-col gap-4 lg:max-h-[360px] lg:overflow-y-auto lg:pr-1">
            {globalContexts.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <p className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em] text-gray-3">
                  <Lock className="h-3 w-3" aria-hidden />
                  Global — applies to every review
                </p>
                {globalContexts.map((c) => (
                  <ContextCard key={c.id} context={c} onDetails={() => setDetailsId(c.id)} />
                ))}
              </div>
            )}
            {localContexts.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {globalContexts.length > 0 && (
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray-3">
                    This review
                  </p>
                )}
                {localContexts.map((c) => (
                  <ContextCard key={c.id} context={c} onDetails={() => setDetailsId(c.id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </aside>

      {detailsContext && (
        <ContextDetails
          context={detailsContext}
          onClose={() => setDetailsId(null)}
          onSave={(cName, cText) => onUpdate(detailsContext.id, cName, cText)}
          onDelete={() => {
            onRemove(detailsContext.id)
            setDetailsId(null)
          }}
          onManageGlobal={() => {
            // Dismiss this sub-dialog first so navigating to Settings is a single click.
            setDetailsId(null)
            onManageGlobal()
          }}
        />
      )}
    </section>
  )
}

// A compact saved-context card. Global entries get a tinted background + lock badge
// so they are visually distinct from this review's own contexts.
function ContextCard({ context, onDetails }: { context: SavedContext; onDetails: () => void }) {
  const global = !isLocal(context)
  const preview =
    context.text.length > 150 ? `${context.text.slice(0, 150).trimEnd()}…` : context.text
  return (
    <div
      className={`flex flex-col border p-3 ${
        global ? "border-gray-2 bg-gray-1" : "border-gray-2 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug text-graphite">{context.name}</p>
        {global && (
          <span className="inline-flex shrink-0 items-center gap-1 border border-gray-3 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-4">
            <Lock className="h-2.5 w-2.5" aria-hidden />
            Global
          </span>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-gray-4">{preview || "No text yet."}</p>
      <button
        type="button"
        onClick={onDetails}
        className="mt-2 inline-flex w-fit items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-racing-green transition-colors hover:text-racing-green-light"
      >
        <Info className="h-3 w-3" aria-hidden />
        Details
      </button>
    </div>
  )
}

interface DetailsProps {
  context: SavedContext
  onClose: () => void
  onSave: (name: string, text: string) => void
  onDelete: () => void
  onManageGlobal: () => void
}

// A modal to view a saved context in full, and (for local entries) edit or delete it.
function ContextDetails({ context, onClose, onSave, onDelete, onManageGlobal }: DetailsProps) {
  // Global entries are managed in Settings, so they are view-only here.
  const readOnly = !isLocal(context)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(context.name)
  const [text, setText] = useState(context.text)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Close on Escape for keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const save = () => {
    if (!name.trim()) return
    onSave(name.trim(), text)
    setEditing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-graphite/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${context.name} details`}
        className="ds-fade-in-up relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden border border-gray-2 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-2 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4">
              {readOnly ? "Global context" : "Saved context"}
            </p>
            <h3 className="mt-1 text-base font-semibold leading-snug text-graphite">
              {editing ? "Edit context" : context.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="flex h-7 w-7 shrink-0 items-center justify-center text-gray-3 transition-colors hover:text-graphite"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="ds-scroll flex-1 overflow-y-auto px-5 py-4">
          {editing ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Context name"
                className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none focus:border-racing-green"
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                aria-label="Context text"
                className="ds-scroll resize-y border border-gray-2 bg-white px-3 py-2 text-sm leading-relaxed text-graphite outline-none focus:border-racing-green"
              />
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-graphite">
              {context.text || "No text yet."}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-2 px-5 py-3">
          {readOnly ? (
            <>
              <button
                type="button"
                onClick={onManageGlobal}
                className="inline-flex items-center gap-1.5 border border-gray-2 bg-white px-3 py-1.5 text-xs font-semibold text-racing-green transition-colors hover:border-racing-green"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                Manage in Settings
              </button>
              <button
                type="button"
                onClick={onClose}
                className="border border-gray-2 bg-white px-3 py-1.5 text-xs font-semibold text-gray-4 hover:border-gray-3"
              >
                Close
              </button>
            </>
          ) : editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setName(context.name)
                  setText(context.text)
                }}
                className="border border-gray-2 bg-white px-3 py-1.5 text-xs font-semibold text-gray-4 hover:border-gray-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!name.trim()}
                className="border border-racing-green bg-racing-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-racing-green-light disabled:cursor-not-allowed disabled:border-gray-2 disabled:bg-gray-2 disabled:text-gray-3"
              >
                Save changes
              </button>
            </>
          ) : confirmDelete ? (
            <>
              <span className="text-xs font-medium text-graphite">Delete this context?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="border border-gray-2 bg-white px-3 py-1.5 text-xs font-semibold text-gray-4 hover:border-gray-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex items-center gap-1.5 border border-tr-red bg-tr-red px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Delete
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 border border-gray-2 bg-white px-3 py-1.5 text-xs font-semibold text-tr-red transition-colors hover:border-tr-red"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Delete
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="border border-racing-green bg-racing-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-racing-green-light"
              >
                Edit context
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
