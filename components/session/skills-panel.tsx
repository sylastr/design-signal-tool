"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Info, Loader2, Plus, Trash2, Upload, X } from "lucide-react"
import type { Skill } from "@/lib/types"
import { extractTextFromFile } from "@/lib/file-extract"

interface Props {
  skills: Skill[]
  onToggle: (id: string) => void
  onAddCustom: (name: string, description: string, instructions: string) => void
  onUpdateCustom: (id: string, name: string, description: string, instructions: string) => void
  onRemoveCustom: (id: string) => void
}

export function SkillsPanel({
  skills,
  onToggle,
  onAddCustom,
  onUpdateCustom,
  onRemoveCustom,
}: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  // The custom skill whose details are open, plus whether we're editing it.
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const detailsSkill = detailsId ? skills.find((s) => s.id === detailsId) ?? null : null

  const resetForm = () => {
    setName("")
    setDescription("")
    setInstructions("")
    setImportError(null)
    setAdding(false)
  }

  const submit = () => {
    if (!name.trim() || !instructions.trim()) return
    onAddCustom(name.trim(), description.trim(), instructions.trim())
    resetForm()
  }

  // Extract text from uploaded files and append it to the skill instructions.
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

  return (
    <section aria-labelledby="skills-heading" className="flex flex-col gap-4">
      <h2
        id="skills-heading"
        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
      >
        Analysis skills
      </h2>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((s) => (
          <div key={s.id} className="relative flex flex-col">
            <button
              type="button"
              onClick={() => onToggle(s.id)}
              aria-pressed={s.active}
              className={`flex h-full w-full items-center gap-3 border p-3 text-left transition-colors ${
                s.active
                  ? "border-racing-green bg-gray-1"
                  : "border-gray-2 bg-white hover:border-gray-3"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-snug text-graphite">
                  {s.name}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-gray-4">
                  {s.description || "Custom skill."}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDetailsId(s.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      e.stopPropagation()
                      setDetailsId(s.id)
                    }
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-racing-green transition-colors hover:text-racing-green-light"
                >
                  <Info className="h-3 w-3" aria-hidden />
                  Details
                </span>
              </span>
              <span
                aria-hidden
                className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
                  s.active
                    ? "border-racing-green bg-racing-green text-white"
                    : "border-gray-3 bg-white"
                }`}
              >
                {s.active && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>
          </div>
        ))}

        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex min-h-[76px] flex-col items-center justify-center gap-1 border border-dashed border-gray-3 bg-white p-3 text-sm font-medium text-gray-4 transition-colors hover:border-tr-orange hover:text-tr-orange"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Custom skill
          </button>
        )}
      </div>

      {adding && (
        <div className="flex flex-col gap-2 border border-gray-2 bg-gray-1 p-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Skill name"
            aria-label="Custom skill name"
            className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description — one line shown on the skill card"
            aria-label="Custom skill description"
            className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
          />
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            placeholder="Instructions — what should this skill look for? Be specific, cite principles."
            aria-label="Custom skill instructions"
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
            <span className="text-[11px] text-gray-3">Appends text from PDF, TXT, MD, or Word</span>
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
              onClick={resetForm}
              className="border border-gray-2 bg-white px-3 py-1.5 text-xs font-semibold text-gray-4 hover:border-gray-3"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!name.trim() || !instructions.trim()}
              className="border border-racing-green bg-racing-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-racing-green-light disabled:cursor-not-allowed disabled:border-gray-2 disabled:bg-gray-2 disabled:text-gray-3"
            >
              Add skill
            </button>
          </div>
        </div>
      )}

      {detailsSkill && (
        <SkillDetails
          skill={detailsSkill}
          onClose={() => setDetailsId(null)}
          onSave={(dName, dDesc, dInstr) => {
            onUpdateCustom(detailsSkill.id, dName, dDesc, dInstr)
          }}
          onDelete={() => {
            onRemoveCustom(detailsSkill.id)
            setDetailsId(null)
          }}
        />
      )}
    </section>
  )
}

interface DetailsProps {
  skill: Skill
  onClose: () => void
  onSave: (name: string, description: string, instructions: string) => void
  onDelete: () => void
}

// A modal to view a custom skill's full instructions, edit it, or delete it.
function SkillDetails({ skill, onClose, onSave, onDelete }: DetailsProps) {
  // Built-in skills are view-only: no editing and no deleting.
  const readOnly = !skill.custom
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(skill.name)
  const [description, setDescription] = useState(skill.description ?? "")
  const [instructions, setInstructions] = useState(skill.instructions)
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
    if (!name.trim() || !instructions.trim()) return
    onSave(name.trim(), description.trim(), instructions.trim())
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
        aria-label={`${skill.name} details`}
        className="ds-fade-in-up relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden border border-gray-2 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-2 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4">
              {skill.custom ? "Custom skill" : "Built-in skill"}
            </p>
            <h3 className="mt-1 text-base font-semibold leading-snug text-graphite">
              {editing ? "Edit skill" : skill.name}
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
                aria-label="Skill name"
                className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none focus:border-racing-green"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description — one line shown on the skill card"
                aria-label="Skill description"
                className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
              />
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={8}
                aria-label="Skill instructions"
                className="ds-scroll resize-y border border-gray-2 bg-white px-3 py-2 text-sm leading-relaxed text-graphite outline-none focus:border-racing-green"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {skill.description && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-4">
                    Description
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-graphite">{skill.description}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-4">
                  Instructions
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-graphite">
                  {skill.instructions}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-2 px-5 py-3">
          {readOnly ? (
            <>
              <span />
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
                  setName(skill.name)
                  setDescription(skill.description ?? "")
                  setInstructions(skill.instructions)
                }}
                className="border border-gray-2 bg-white px-3 py-1.5 text-xs font-semibold text-gray-4 hover:border-gray-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!name.trim() || !instructions.trim()}
                className="border border-racing-green bg-racing-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-racing-green-light disabled:cursor-not-allowed disabled:border-gray-2 disabled:bg-gray-2 disabled:text-gray-3"
              >
                Save changes
              </button>
            </>
          ) : confirmDelete ? (
            <>
              <span className="text-xs font-medium text-graphite">Delete this skill?</span>
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
                Edit skill
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
