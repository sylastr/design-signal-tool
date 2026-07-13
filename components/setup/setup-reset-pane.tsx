"use client"

import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { clearAllData } from "@/lib/storage"

export function SetupResetPane() {
  // Two-step confirm so a wipe is always deliberate.
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-bold tracking-tight text-graphite">Reset</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-4">
          Restore all settings to their defaults and remove every saved skill, context, and draft.
          This cannot be undone.
        </p>
      </div>

      <section aria-labelledby="reset-data" className="flex flex-col gap-3">
        <div>
          <h4
            id="reset-data"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
          >
            Clear local data
          </h4>
          <p className="mt-1 text-sm text-gray-4">
            Wipes everything stored in this browser and reloads the app in its default state.
          </p>
        </div>
        <div className="flex flex-col gap-3 border border-tr-red/40 bg-tr-red/5 px-4 py-3 sm:flex-row sm:items-center">
          <span className="flex-1 text-sm font-semibold text-graphite">
            {confirmReset ? "Are you sure? This clears everything." : "Reset all data"}
          </span>
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="inline-flex h-8 items-center px-3 text-sm font-medium text-graphite transition-colors hover:bg-gray-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={clearAllData}
                className="inline-flex h-8 items-center gap-1.5 bg-tr-red px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Reset everything
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex h-8 items-center gap-1.5 self-start border border-tr-red px-3 text-sm font-semibold text-tr-red transition-colors hover:bg-tr-red hover:text-white sm:self-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
