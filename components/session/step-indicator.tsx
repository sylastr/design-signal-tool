"use client"

import { Check } from "lucide-react"

export interface Step {
  id: string
  label: string
  /** Short helper shown under the label for the active step. */
  hint: string
}

interface Props {
  steps: Step[]
  /** Index of the current step. */
  current: number
  /** Called when the user clicks a reachable (already-completed) step. */
  onStepClick: (index: number) => void
}

/**
 * Linear progress indicator for the stepped analysis flow.
 *
 * Backward navigation is allowed (click any completed step); forward jumps are
 * not, so the strict gating in the wizard bar stays authoritative.
 */
export function StepIndicator({ steps, current, onStepClick }: Props) {
  return (
    <nav aria-label="Analysis steps" className="mb-8">
      <ol className="flex items-start">
        {steps.map((step, i) => {
          const isDone = i < current
          const isCurrent = i === current
          const reachable = i <= current
          return (
            <li key={step.id} className="flex flex-1 items-start last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => reachable && onStepClick(i)}
                  disabled={!reachable}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-colors ${
                    isCurrent
                      ? "border-racing-green bg-racing-green text-white"
                      : isDone
                        ? "border-racing-green bg-white text-racing-green hover:bg-gray-1"
                        : "border-gray-2 bg-white text-gray-3"
                  } ${reachable ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  {isDone ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                </button>
                <div className="flex w-24 flex-col items-center text-center sm:w-32">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
                      isCurrent || isDone ? "text-graphite" : "text-gray-3"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="mt-0.5 text-[11px] leading-snug text-gray-4">{step.hint}</span>
                  )}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  aria-hidden
                  className={`mt-4 h-px flex-1 ${i < current ? "bg-racing-green" : "bg-gray-2"}`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
