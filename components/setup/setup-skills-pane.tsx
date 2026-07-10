"use client"

import { useState } from "react"
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react"
import type { Skill } from "@/lib/types"
import { ToggleSwitch } from "@/components/setup/toggle-switch"

interface Props {
  skills: Skill[]
  onAddCustom: (name: string, instructions: string) => void
  onUpdateCustom: (id: string, name: string, instructions: string) => void
  onRemoveCustom: (id: string) => void
  onToggleHidden: (id: string, hidden: boolean) => void
}

export function SetupSkillsPane({
  skills,
  onAddCustom,
  onUpdateCustom,
  onRemoveCustom,
  onToggleHidden,
}: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [instructions, setInstructions] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editInstructions, setEditInstructions] = useState("")

  const visibleCount = skills.filter((s) => !s.hidden).length

  const submitNew = () => {
    if (!name.trim() || !instructions.trim()) return
    onAddCustom(name.trim(), instructions.trim())
    setName("")
    setInstructions("")
    setAdding(false)
  }

  const startEdit = (s: Skill) => {
    setExpandedId(s.id)
    setEditId(s.id)
    setEditName(s.name)
    setEditInstructions(s.instructions)
  }

  const submitEdit = () => {
    if (!editId || !editName.trim() || !editInstructions.trim()) return
    onUpdateCustom(editId, editName.trim(), editInstructions.trim())
    setEditId(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-graphite">Skills</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-4">
            The critique lenses available in the review flow. Hide the ones you don&apos;t use,
            or add your own.{" "}
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
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            placeholder="Instructions — what should this skill look for? Be specific, cite principles."
            aria-label="New skill instructions"
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
                    <span
                      className={`truncate text-sm font-semibold ${
                        s.hidden ? "text-gray-4" : "text-graphite"
                      }`}
                    >
                      {s.name}
                    </span>
                    <span className="truncate text-xs text-gray-3">
                      {s.custom ? "Custom skill" : "Built-in skill"}
                    </span>
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-3">
                  {s.custom && (
                    <>
                      <button
                        type="button"
                        onClick={() => (isEdit ? setEditId(null) : startEdit(s))}
                        aria-label={`Edit ${s.name}`}
                        title="Edit"
                        className="flex h-8 w-8 items-center justify-center border border-transparent text-gray-4 transition-colors hover:border-gray-3 hover:text-graphite"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveCustom(s.id)}
                        aria-label={`Delete ${s.name}`}
                        title="Delete"
                        className="flex h-8 w-8 items-center justify-center border border-transparent text-gray-4 transition-colors hover:border-tr-red hover:text-tr-red"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </>
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
                  {isEdit && s.custom ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        aria-label="Edit skill name"
                        className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none focus:border-racing-green"
                      />
                      <textarea
                        value={editInstructions}
                        onChange={(e) => setEditInstructions(e.target.value)}
                        rows={5}
                        aria-label="Edit skill instructions"
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
                          onClick={submitEdit}
                          disabled={!editName.trim() || !editInstructions.trim()}
                          className="border border-racing-green bg-racing-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-racing-green-light disabled:cursor-not-allowed disabled:border-gray-2 disabled:bg-gray-2 disabled:text-gray-3"
                        >
                          Save changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-graphite">
                      {s.instructions}
                    </p>
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
