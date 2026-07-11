"use client"

import { Minus, Plus } from "lucide-react"
import {
  SECTION_ORDER,
  TIER_ORDER,
  type AnalysisPrefs,
  type SectionKey,
  type Tier,
} from "@/lib/types"
import { MAX_SUGGESTIONS, MIN_SUGGESTIONS } from "@/lib/storage"
import { ToggleSwitch } from "@/components/setup/toggle-switch"

interface Props {
  prefs: AnalysisPrefs
  onToggleTier: (tier: Tier, enabled: boolean) => void
  onToggleSection: (section: SectionKey, enabled: boolean) => void
  onMaxSuggestionsChange: (n: number) => void
}

// Tier dot colors mirror the result view so the settings read as the same system.
const TIER_COLOR: Record<Tier, string> = {
  "must-fix": "var(--tr-red)",
  "should-consider": "var(--tr-orange)",
  "nice-to-have": "var(--gray-3)",
}

export function SetupAnalysisPane({
  prefs,
  onToggleTier,
  onToggleSection,
  onMaxSuggestionsChange,
}: Props) {
  const enabledTiers = TIER_ORDER.filter((t) => prefs.tiers[t.key]).length
  const enabledSections = SECTION_ORDER.filter((s) => prefs.sections[s.key]).length
  const canDecrement = prefs.maxSuggestions > MIN_SUGGESTIONS
  const canIncrement = prefs.maxSuggestions < MAX_SUGGESTIONS

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-bold tracking-tight text-graphite">Analysis</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-4">
          Control how recommendations are generated and displayed across every review.
        </p>
      </div>

      {/* Maximum suggestions */}
      <section aria-labelledby="analysis-max" className="flex flex-col gap-3">
        <div>
          <h4
            id="analysis-max"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
          >
            Maximum suggestions
          </h4>
          <p className="mt-1 text-sm text-gray-4">
            The most recommendations the AI can return per design (1&ndash;{MAX_SUGGESTIONS}).
          </p>
        </div>
        <div className="flex items-center gap-3 border border-gray-2 px-4 py-3">
          <span className="flex-1 text-sm font-semibold text-graphite">Suggestions per design</span>
          <div className="flex items-center border border-gray-2">
            <button
              type="button"
              onClick={() => onMaxSuggestionsChange(prefs.maxSuggestions - 1)}
              disabled={!canDecrement}
              aria-label="Decrease maximum suggestions"
              className="flex h-8 w-8 items-center justify-center text-graphite transition-colors hover:bg-gray-1 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span
              aria-live="polite"
              className="flex h-8 w-10 items-center justify-center border-x border-gray-2 text-sm font-semibold tabular-nums text-graphite"
            >
              {prefs.maxSuggestions}
            </span>
            <button
              type="button"
              onClick={() => onMaxSuggestionsChange(prefs.maxSuggestions + 1)}
              disabled={!canIncrement}
              aria-label="Increase maximum suggestions"
              className="flex h-8 w-8 items-center justify-center text-graphite transition-colors hover:bg-gray-1 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </section>

      {/* Recommendation priority */}
      <section aria-labelledby="analysis-priority" className="flex flex-col gap-3">
        <div>
          <h4
            id="analysis-priority"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
          >
            Recommendation priority
          </h4>
          <p className="mt-1 text-sm text-gray-4">
            Choose which severity levels appear in results.{" "}
            <span className="font-medium text-graphite">{enabledTiers} of {TIER_ORDER.length} on</span>.
          </p>
        </div>
        <ul className="flex flex-col divide-y divide-gray-2 border border-gray-2">
          {TIER_ORDER.map((t) => {
            const on = prefs.tiers[t.key]
            return (
              <li key={t.key} className={`flex items-center gap-3 px-4 py-3 ${on ? "bg-white" : "bg-gray-1/60"}`}>
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: on ? TIER_COLOR[t.key] : "transparent",
                    boxShadow: on ? undefined : `inset 0 0 0 1.5px ${TIER_COLOR[t.key]}`,
                  }}
                  aria-hidden
                />
                <span className={`flex-1 text-sm font-semibold ${on ? "text-graphite" : "text-gray-4"}`}>
                  {t.label}
                </span>
                <ToggleSwitch
                  checked={on}
                  onChange={(enabled) => onToggleTier(t.key, enabled)}
                  label={`Include ${t.label} recommendations`}
                />
              </li>
            )
          })}
        </ul>
      </section>

      {/* Feedback detail */}
      <section aria-labelledby="analysis-detail" className="flex flex-col gap-3">
        <div>
          <h4
            id="analysis-detail"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
          >
            Feedback detail
          </h4>
          <p className="mt-1 text-sm text-gray-4">
            Choose which parts of each recommendation are shown.{" "}
            <span className="font-medium text-graphite">
              {enabledSections} of {SECTION_ORDER.length} on
            </span>
            .
          </p>
        </div>
        <ul className="flex flex-col divide-y divide-gray-2 border border-gray-2">
          {SECTION_ORDER.map((s) => {
            const on = prefs.sections[s.key]
            return (
              <li key={s.key} className={`flex items-center gap-3 px-4 py-3 ${on ? "bg-white" : "bg-gray-1/60"}`}>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={`text-sm font-semibold ${on ? "text-graphite" : "text-gray-4"}`}>
                    {s.label}
                  </span>
                  <span className="text-xs text-gray-3">{s.description}</span>
                </span>
                <ToggleSwitch
                  checked={on}
                  onChange={(enabled) => onToggleSection(s.key, enabled)}
                  label={`Show the ${s.label} paragraph`}
                />
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
