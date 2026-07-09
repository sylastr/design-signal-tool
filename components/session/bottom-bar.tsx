"use client"

import { Minus, Plus } from "lucide-react"
import { MAX_SUGGESTIONS, MIN_SUGGESTIONS } from "@/lib/storage"

interface Props {
  hasArtifact: boolean
  activeLensCount: number
  analyzing: boolean
  suggestionCount: number
  onSuggestionCountChange: (n: number) => void
  onAnalyze: () => void
}

export function BottomBar({
  hasArtifact,
  activeLensCount,
  analyzing,
  suggestionCount,
  onSuggestionCountChange,
  onAnalyze,
}: Props) {
  const status = hasArtifact
    ? `1 artifact selected · ${activeLensCount} ${activeLensCount === 1 ? "lens" : "lenses"} active`
    : "No artifact selected"

  const disabled = !hasArtifact || analyzing
  const canDecrement = suggestionCount > MIN_SUGGESTIONS
  const canIncrement = suggestionCount < MAX_SUGGESTIONS

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-2 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <p className="text-sm text-gray-4">{status}</p>

        <div className="flex items-center gap-3">
          {/* Suggestion count stepper */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-4">
              Suggestions
            </span>
            <div className="flex items-center border border-gray-2">
              <button
                type="button"
                onClick={() => onSuggestionCountChange(suggestionCount - 1)}
                disabled={!canDecrement}
                aria-label="Decrease suggestions"
                className="flex h-8 w-8 items-center justify-center text-graphite transition-colors hover:bg-gray-1 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden />
              </button>
              <span
                aria-live="polite"
                className="flex h-8 w-8 items-center justify-center border-x border-gray-2 text-sm font-semibold tabular-nums text-graphite"
              >
                {suggestionCount}
              </span>
              <button
                type="button"
                onClick={() => onSuggestionCountChange(suggestionCount + 1)}
                disabled={!canIncrement}
                aria-label="Increase suggestions"
                className="flex h-8 w-8 items-center justify-center text-graphite transition-colors hover:bg-gray-1 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={disabled}
            className={`px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
              disabled ? "cursor-not-allowed bg-gray-3" : "bg-tr-orange hover:brightness-95"
            }`}
          >
            {analyzing ? "Analyzing…" : "Analyze design"}
          </button>
        </div>
      </div>
    </div>
  )
}
