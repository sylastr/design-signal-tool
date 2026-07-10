"use client"

import { useState } from "react"
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react"
import type { SavedContext } from "@/lib/types"
import { ToggleSwitch } from "@/components/setup/toggle-switch"

interface Props {
  contexts: SavedContext[]
  onAdd: (name: string, text: string) => void
  onUpdate: (id: string, name: string, text: string) => void
  onRemove: (id: string) => void
  onToggleHidden: (id: string, hidden: boolean) => void
}

export function SetupContextsPane({
  contexts,
  onAdd,
  onUpdate,
  onRemove,
  onToggleHidden,
}: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editText, setEditText] = useState("")

  const visibleCount = contexts.filter((c) => !c.hidden).length

  const submitNew = () => {
    if (!name.trim() || !text.trim()) return
    onAdd(name.trim(), text.trim())
    setName("")
    setText("")
    setAdding(false)
  }

  const startEdit = (c: SavedContext) => {
    setExpandedId(c.id)
    setEditId(c.id)
    setEditName(c.name)
    setEditText(c.text)
  }

  const submitEdit = () => {
    if (!editId || !editName.trim() || !editText.trim()) return
    onUpdate(editId, editName.trim(), editText.trim())
    setEditId(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-graphite">Contexts</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-4">
            Reusable project &amp; product background composed into every review. Hide entries
            you don&apos;t want applied, or add new ones.{" "}
            <span className="font-medium text-graphite">
              {visibleCount} of {contexts.length} shown
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
            Add context
          </button>
        )}
      </div>

      {/* Add new context form */}
      {adding && (
        <div className="flex flex-col gap-2 border border-gray-2 bg-gray-1 p-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this context"
            aria-label="New context name"
            className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="e.g. Target users are legal researchers; goal is to reduce time-to-first-result; must follow TR brand guidelines..."
            aria-label="New context text"
            className="ds-scroll resize-y border border-gray-2 bg-white px-3 py-2 text-sm leading-relaxed text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setName("")
                setText("")
              }}
              className="border border-gray-2 bg-white px-3 py-1.5 text-xs font-semibold text-gray-4 hover:border-gray-3"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitNew}
              disabled={!name.trim() || !text.trim()}
              className="border border-racing-green bg-racing-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-racing-green-light disabled:cursor-not-allowed disabled:border-gray-2 disabled:bg-gray-2 disabled:text-gray-3"
            >
              Add context
            </button>
          </div>
        </div>
      )}

      {contexts.length === 0 ? (
        <p className="border border-dashed border-gray-2 px-4 py-8 text-center text-sm text-gray-3">
          No saved contexts yet. Add one to reuse it across reviews.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-2 border border-gray-2">
          {contexts.map((c) => {
            const isExpanded = expandedId === c.id
            const isEdit = editId === c.id
            return (
              <li key={c.id} className={c.hidden ? "bg-gray-1/60" : "bg-white"}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(null)
                      setExpandedId(isExpanded ? null : c.id)
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
                          c.hidden ? "text-gray-4" : "text-graphite"
                        }`}
                      >
                        {c.name}
                      </span>
                      <span className="truncate text-xs text-gray-3">{c.text}</span>
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => (isEdit ? setEditId(null) : startEdit(c))}
                      aria-label={`Edit ${c.name}`}
                      title="Edit"
                      className="flex h-8 w-8 items-center justify-center border border-transparent text-gray-4 transition-colors hover:border-gray-3 hover:text-graphite"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(c.id)}
                      aria-label={`Delete ${c.name}`}
                      title="Delete"
                      className="flex h-8 w-8 items-center justify-center border border-transparent text-gray-4 transition-colors hover:border-tr-red hover:text-tr-red"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                    <ToggleSwitch
                      checked={!c.hidden}
                      onChange={(shown) => onToggleHidden(c.id, !shown)}
                      label={`Apply ${c.name} in reviews`}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-2 bg-gray-1 px-4 py-3">
                    {isEdit ? (
                      <div className="flex flex-col gap-2">
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
                            onClick={submitEdit}
                            disabled={!editName.trim() || !editText.trim()}
                            className="border border-racing-green bg-racing-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-racing-green-light disabled:cursor-not-allowed disabled:border-gray-2 disabled:bg-gray-2 disabled:text-gray-3"
                          >
                            Save changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-graphite">
                        {c.text}
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
