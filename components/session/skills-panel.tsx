"use client"

import { useRef, useState } from "react"
import { Check, Loader2, Plus, Upload, X } from "lucide-react"
import type { Skill } from "@/lib/types"
import { extractTextFromFile } from "@/lib/file-extract"

interface Props {
  skills: Skill[]
  onToggle: (id: string) => void
  onAddCustom: (name: string, description: string, instructions: string) => void
  onRemoveCustom: (id: string) => void
}

export function SkillsPanel({ skills, onToggle, onAddCustom, onRemoveCustom }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

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
      setImportError("Couldn't read that file. Supported: PDF, TXT, DOCX.")
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
          <div key={s.id} className="relative">
            <button
              type="button"
              onClick={() => onToggle(s.id)}
              aria-pressed={s.active}
              className={`flex h-full w-full flex-col items-start gap-1 border p-3 text-left transition-colors ${
                s.active
                  ? "border-racing-green bg-racing-green/5"
                  : "border-gray-2 bg-white hover:border-gray-3"
              }`}
            >
              <span className="flex w-full items-start justify-between gap-2">
                <span
                  className={`text-sm font-semibold leading-snug ${
                    s.active ? "text-racing-green" : "text-graphite"
                  } ${s.custom ? "pr-5" : ""}`}
                >
                  {s.name}
                </span>
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${
                    s.active
                      ? "border-racing-green bg-racing-green text-white"
                      : "border-gray-3 bg-white text-transparent"
                  }`}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              </span>
              <span className="text-xs leading-relaxed text-gray-4">
                {s.description || "Custom skill."}
              </span>
            </button>
            {s.custom && (
              <button
                type="button"
                onClick={() => onRemoveCustom(s.id)}
                aria-label={`Delete skill ${s.name}`}
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center text-gray-3 transition-colors hover:text-tr-red"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
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
    </section>
  )
}
