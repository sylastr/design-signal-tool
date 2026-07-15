"use client"

import { useRef, useState } from "react"
import { Download, RotateCcw, Upload } from "lucide-react"
import { clearAllData, exportConfig, importConfig } from "@/lib/storage"

export function SetupResetPane() {
  // Two-step confirm so a wipe is always deliberate.
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ kind: "ok" | "error"; message: string } | null>(null)

  // Read the picked file, merge it into storage, and reload so every hook
  // re-hydrates with the restored config.
  const handleImportFile = async (file: File | undefined) => {
    if (!file) return
    setStatus(null)
    try {
      const text = await file.text()
      const result = importConfig(text)
      if (!result.ok) {
        setStatus({ kind: "error", message: result.error ?? "Import failed." })
        return
      }
      const { contexts, customSkills, overrides } = result.imported ?? {
        contexts: 0,
        customSkills: 0,
        overrides: 0,
      }
      setStatus({
        kind: "ok",
        message: `Restored ${contexts} context${contexts === 1 ? "" : "s"}, ${customSkills} custom skill${
          customSkills === 1 ? "" : "s"
        }, and ${overrides} edited built-in${overrides === 1 ? "" : "s"}. Reloading…`,
      })
      // Give the confirmation a beat to render before the reload.
      setTimeout(() => window.location.reload(), 900)
    } catch {
      setStatus({ kind: "error", message: "Couldn't read that file." })
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-bold tracking-tight text-graphite">Backup &amp; reset</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-4">
          Your skills and contexts live in this browser. Export a backup so you don&apos;t lose them
          if this browser is cleared, and restore it here or on another machine.
        </p>
      </div>

      {/* Backup: export / import */}
      <section aria-labelledby="backup-data" className="flex flex-col gap-3">
        <div>
          <h4
            id="backup-data"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
          >
            Backup &amp; restore
          </h4>
          <p className="mt-1 text-sm text-gray-4">
            Download a JSON file of your saved contexts, custom skills, edited built-in skills, and
            analysis preferences. Re-upload it any time to add them back.
          </p>
        </div>

        <div className="flex flex-col gap-3 border border-gray-2 bg-gray-1 px-4 py-3 sm:flex-row sm:items-center">
          <span className="flex-1 text-sm font-semibold text-graphite">
            Export or restore your configuration
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStatus(null)
                exportConfig()
              }}
              className="inline-flex h-8 items-center gap-1.5 border border-racing-green bg-white px-3 text-sm font-semibold text-racing-green transition-colors hover:bg-racing-green hover:text-white"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Export
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex h-8 items-center gap-1.5 border border-gray-3 bg-white px-3 text-sm font-semibold text-graphite transition-colors hover:border-tr-orange hover:text-tr-orange"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden />
              Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                const picked = e.target.files?.[0]
                e.target.value = ""
                void handleImportFile(picked)
              }}
            />
          </div>
        </div>

        {status && (
          <p
            role="status"
            className={`text-sm font-medium ${
              status.kind === "ok" ? "text-racing-green" : "text-tr-red"
            }`}
          >
            {status.message}
          </p>
        )}
      </section>

      {/* Destructive reset */}
      <section aria-labelledby="reset-data" className="flex flex-col gap-3">
        <div>
          <h4
            id="reset-data"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4"
          >
            Clear local data
          </h4>
          <p className="mt-1 text-sm text-gray-4">
            Wipes everything stored in this browser and reloads the app in its default state. Export
            a backup first if you want to keep your skills and contexts.
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
