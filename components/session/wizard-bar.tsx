"use client"

import { ArrowLeft, ArrowRight, Loader2, Minus, Plus, Sparkles } from "lucide-react"
import { MAX_SUGGESTIONS, MIN_SUGGESTIONS } from "@/lib/storage"

interface Props {
  /** True on the first step (Back is hidden). */
  isFirst: boolean
  /** True on the final step (shows Analyze instead of Next). */
  isLast: boolean
  /** Whether the current step's gate is satisfied. */
  canAdvance: boolean
  /** Message explaining what's needed when the gate is not satisfied. */
  gateHint: string
  analyzing: boolean
  suggestionCount: number
  onSuggestionCountChange: (n: number) => void
  onBack: () => void
  onNext: () => void
  onAnalyze: () => void
  /** Number of artifacts that already have a cached analysis. */
  analyzedCount: number
  /** True when the current batch has already been analyzed (Re-analyze label). */
  batchHasResult: boolean
  onViewResults: () => void
}

export function WizardBar({
  isFirst,
  isLast,
  canAdvance,
  gateHint,
  analyzing,
  suggestionCount,
  onSuggestionCountChange,
  onBack,
  onNext,
  onAnalyze,
  analyzedCount,
  batchHasResult,
  onViewResults,
}: Props) {
  const canDecrement = suggestionCount > MIN_SUGGESTIONS
  const canIncrement = suggestionCount < MAX_SUGGESTIONS
  const analyzeDisabled = !canAdvance || analyzing

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-2 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
        {/* Gate hint / status on the left */}
        <p className={`text-sm ${canAdvance ? "text-gray-4" : "text-tr-orange"}`}>{gateHint}</p>

        <div className="flex flex-wrap items-center gap-3">
          {/* Suggestion count — only relevant on the final (Analyze) step */}
          {isLast && (
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
          )}

          {analyzedCount > 0 && (
            <button
              type="button"
              onClick={onViewResults}
              className="border border-racing-green px-4 py-2.5 text-sm font-semibold text-racing-green transition-colors hover:bg-gray-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tr-orange focus-visible:ring-offset-1"
            >
              {`View analysis${analyzedCount > 1 ? ` (${analyzedCount})` : ""}`}
            </button>
          )}

          {!isFirst && (
            <button
              type="button"
              onClick={onBack}
              disabled={analyzing}
              className="inline-flex items-center gap-2 border border-gray-2 px-4 py-2.5 text-sm font-semibold text-graphite transition-colors hover:border-gray-3 disabled:cursor-not-allowed disabled:text-gray-3"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back
            </button>
          )}

          {isLast ? (
            <button
              type="button"
              onClick={onAnalyze}
              disabled={analyzeDisabled}
              aria-busy={analyzing}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
                analyzeDisabled ? "cursor-not-allowed bg-gray-3" : "bg-tr-orange hover:brightness-95"
              }`}
            >
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden />
              )}
              {analyzing ? "Analyzing…" : batchHasResult ? "Re-analyze" : "Analyze design"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={!canAdvance}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
                !canAdvance ? "cursor-not-allowed bg-gray-3" : "bg-racing-green hover:bg-racing-green-light"
              }`}
            >
              Next
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
