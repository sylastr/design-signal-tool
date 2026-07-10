"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import type { Skill } from "@/lib/types"

interface Props {
  skills: Skill[]
  onToggle: (id: string) => void
  onAddCustom: (name: string, instructions: string) => void
  onRemoveCustom: (id: string) => void
}

export function SkillsPanel({ skills, onToggle, onAddCustom, onRemoveCustom }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [instructions, setInstructions] = useState("")

  const submit = () => {
    if (!name.trim() || !instructions.trim()) return
    onAddCustom(name.trim(), instructions.trim())
    setName("")
    setInstructions("")
    setAdding(false)
  }

  return (
    <section aria-labelledby="skills-heading" className="flex flex-col gap-4">
      <h2
        id="skills-heading"
        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
      >
        Analysis skills
      </h2>

      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <span key={s.id} className="relative inline-flex">
            <button
              type="button"
              onClick={() => onToggle(s.id)}
              aria-pressed={s.active}
              title={s.instructions}
              className={`inline-flex items-center border px-3 py-1.5 text-sm font-medium transition-colors ${
                s.active
                  ? "border-racing-green bg-racing-green text-white"
                  : "border-gray-2 bg-white text-graphite hover:border-gray-3"
              } ${s.custom ? "pr-7" : ""}`}
            >
              {s.name}
            </button>
            {s.custom && (
              <button
                type="button"
                onClick={() => onRemoveCustom(s.id)}
                aria-label={`Delete skill ${s.name}`}
                className={`absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center ${
                  s.active ? "text-white/80 hover:text-white" : "text-gray-3 hover:text-tr-red"
                }`}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </span>
        ))}

        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 border border-dashed border-gray-3 bg-white px-3 py-1.5 text-sm font-medium text-gray-4 transition-colors hover:border-tr-orange hover:text-tr-orange"
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
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            placeholder="Instructions — what should this skill look for? Be specific, cite principles."
            aria-label="Custom skill instructions"
            className="ds-scroll resize-y border border-gray-2 bg-white px-3 py-2 text-sm leading-relaxed text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setName("")
                setInstructions("")
              }}
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
