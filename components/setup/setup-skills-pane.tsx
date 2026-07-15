"use client"

import { useRef, useState } from "react"
import { ChevronDown, Loader2, Pencil, Plus, RotateCcw, Trash2, Upload } from "lucide-react"
import type { Skill } from "@/lib/types"
import { extractTextFromFile } from "@/lib/file-extract"
import { ToggleSwitch } from "@/components/setup/toggle-switch"
import { Markdown } from "@/components/markdown"

interface Props {
  skills: Skill[]
  onAddCustom: (name: string, description: string, instructions: string) => void
  onUpdateSkill: (id: string, name: string, description: string, instructions: string) => void
  onResetSkill: (id: string) => void
  onRemoveCustom: (id: string) => void
  onToggleHidden: (id: string, hidden: boolean) => void
}

export function SetupSkillsPane({
  skills,
  onAddCustom,
  onUpdateSkill,
  onResetSkill,
  onRemoveCustom,
  onToggleHidden,
}: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editInstructions, setEditInstructions] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const visibleCount = skills.filter((s) => !s.hidden).length

  const submitNew = () => {
    if (!name.trim() || !instructions.trim()) return
    onAddCustom(name.trim(), description.trim(), instructions.trim())
    setName("")
    setDescription("")
    setInstructions("")
    setImportError(null)
    setAdding(false)
  }

  // Extract text from uploaded files and append it to the new-skill instructions.
  const handleImportFiles = async (files: File[]) => {
    if (!files.length) return
    setImportError(null)
    setImporting(true)
    try {
      const texts: string[] = []
      for (const file of files) {
        const extracted = await extractTextFromFile(file)
        if (extracted) texts.push(extracted)
      }
      const joined = texts.join("\n\n").trim()
      if (!joined) {
        setImportError("No readable text found in that file.")
        return
      }
      setInstructions((prev) => (prev.trim() ? `${prev.trim()}\n\n${joined}` : joined))
    } catch {
      setImportError("Couldn't read that file. Supported: PDF, TXT, MD, DOCX.")
    } finally {
      setImporting(false)
    }
  }

  const startEdit = (s: Skill) => {
    setExpandedId(s.id)
    setEditId(s.id)
    setEditName(s.name)
    setEditDescription(s.description ?? "")
    setEditInstructions(s.instructions)
  }

  const submitEdit = () => {
    if (!editId || !editName.trim() || !editInstructions.trim()) return
    onUpdateSkill(editId, editName.trim(), editDescription.trim(), editInstructions.trim())
    setEditId(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-graphite">Skills</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-4">
            The critique lenses available in the review flow. Edit any lens to fit your team,
            hide the ones you don&apos;t use, or add your own.{" "}
            <span className="font-medium text-graphite">
              {visibleCount} of {skills.length} shown
            </span>
            .
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex shrink-0 items-center gap-1.5 border border-racing-green bg-white px-3 py-2 text-sm font-semibold text-racing-green transition-colors hover:bg-racing-green hover:text-white"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add skill
          </button>
        )}
      </div>

      {/* Add new skill form */}
      {adding && (
        <div className="flex flex-col gap-2 border border-gray-2 bg-gray-1 p-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Skill name"
            aria-label="New skill name"
            className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description — one line shown on the skill card"
            aria-label="New skill description"
            className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
          />
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            placeholder="Instructions — what should this skill look for? Be specific, cite principles."
            aria-label="New skill instructions"
            className="ds-scroll resize-y border border-gray-2 bg-white px-3 py-2 text-sm leading-relaxed text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
          />
          {/* Import skill instructions from a file */}
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
            <span className="text-[11px] text-gray-3">Appends text from PDF, TXT, MD or Word</span>
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setName("")
                setDescription("")
                setInstructions("")
                setImportError(null)
              }}
              className="border border-gray-2 bg-white px-3 py-1.5 text-xs font-semibold text-gray-4 hover:border-gray-3"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitNew}
              disabled={!name.trim() || !instructions.trim()}
              className="border border-racing-green bg-racing-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-racing-green-light disabled:cursor-not-allowed disabled:border-gray-2 disabled:bg-gray-2 disabled:text-gray-3"
            >
              Add skill
            </button>
          </div>
        </div>
      )}

      {/* Skill list */}
      <ul className="flex flex-col divide-y divide-gray-2 border border-gray-2">
        {skills.map((s) => {
          const isExpanded = expandedId === s.id
          const isEdit = editId === s.id
          return (
            <li key={s.id} className={s.hidden ? "bg-gray-1/60" : "bg-white"}>
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null)
                    setExpandedId(isExpanded ? null : s.id)
                  }}
                  aria-expanded={isExpanded}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-3 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2">
                      <span
                        className={`truncate text-sm font-semibold ${
                          s.hidden ? "text-gray-4" : "text-graphite"
                        }`}
                      >
                        {s.name}
                      </span>
                      {s.edited && (
                        <span className="shrink-0 border border-gray-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-gray-4">
                          Edited
                        </span>
                      )}
                    </span>
                    <span className="truncate text-xs text-gray-3">
                      {s.description || (s.custom ? "Custom skill" : "Built-in skill")}
                    </span>
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => (isEdit ? setEditId(null) : startEdit(s))}
                    aria-label={`Edit ${s.name}`}
                    title="Edit"
                    className="flex h-8 w-8 items-center justify-center border border-transparent text-gray-4 transition-colors hover:border-gray-3 hover:text-graphite"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  {s.custom && (
                    <button
                      type="button"
                      onClick={() => onRemoveCustom(s.id)}
                      aria-label={`Delete ${s.name}`}
                      title="Delete"
                      className="flex h-8 w-8 items-center justify-center border border-transparent text-gray-4 transition-colors hover:border-tr-red hover:text-tr-red"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                  <ToggleSwitch
                    checked={!s.hidden}
                    onChange={(shown) => onToggleHidden(s.id, !shown)}
                    label={`Show ${s.name} in the review flow`}
                  />
                </div>
              </div>

              {/* Expanded detail / edit */}
              {isExpanded && (
                <div className="border-t border-gray-2 bg-gray-1 px-4 py-3">
                  {isEdit ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        aria-label="Edit skill name"
                        className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none focus:border-racing-green"
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Short description — one line shown on the skill card"
                        aria-label="Edit skill description"
                        className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
                      />
                      <textarea
                        value={editInstructions}
                        onChange={(e) => setEditInstructions(e.target.value)}
                        rows={5}
                        aria-label="Edit skill instructions"
                        className="ds-scroll resize-y border border-gray-2 bg-white px-3 py-2 text-sm leading-relaxed text-graphite outline-none focus:border-racing-green"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditId(null)}
                          className="border border-gray-2 bg-white px-3 py-1.5 text-xs font-semibold text-gray-4 hover:border-gray-3"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={submitEdit}
                          disabled={!editName.trim() || !editInstructions.trim()}
                          className="border border-racing-green bg-racing-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-racing-green-light disabled:cursor-not-allowed disabled:border-gray-2 disabled:bg-gray-2 disabled:text-gray-3"
                        >
                          Save changes
                        </button>
                        {/* Built-in skills can be restored to their shipped copy. */}
                        {!s.custom && s.edited && (
                          <button
                            type="button"
                            onClick={() => {
                              onResetSkill(s.id)
                              setEditId(null)
                            }}
                            className="ml-auto inline-flex items-center gap-1.5 border border-transparent px-2.5 py-1.5 text-xs font-medium text-gray-4 transition-colors hover:text-tr-orange"
                          >
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                            Reset to default
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Markdown>{s.instructions}</Markdown>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
