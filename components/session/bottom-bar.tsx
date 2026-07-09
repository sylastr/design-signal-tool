"use client"

interface Props {
  hasArtifact: boolean
  activeLensCount: number
  analyzing: boolean
  onAnalyze: () => void
}

export function BottomBar({ hasArtifact, activeLensCount, analyzing, onAnalyze }: Props) {
  const status = hasArtifact
    ? `1 artifact selected · ${activeLensCount} ${activeLensCount === 1 ? "lens" : "lenses"} active`
    : "No artifact selected"

  const disabled = !hasArtifact || analyzing

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-2 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="text-sm text-gray-4">{status}</p>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={disabled}
          className={`px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
            disabled
              ? "cursor-not-allowed bg-gray-3"
              : "bg-tr-orange hover:brightness-95"
          }`}
        >
          {analyzing ? "Analyzing…" : "Analyze design"}
        </button>
      </div>
    </div>
  )
}
