import { Settings } from "lucide-react"

export function Header({ onOpenSetup }: { onOpenSetup?: () => void }) {
  return (
    <header className="sticky top-0 z-40">
      {/* 4px TR Orange bar across the very top */}
      <div className="h-1 w-full bg-tr-orange" />
      <div className="flex items-center justify-between border-b border-gray-2 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {/* TR logo mark */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center bg-racing-green"
            aria-hidden
          >
            <span className="text-[15px] font-bold leading-none tracking-tight text-white">
              TR
            </span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[17px] font-bold tracking-tight text-graphite">
              Design Signal Tool
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-4">
              design review Assistant, on the spot
            </span>
          </div>
        </div>

        {onOpenSetup && (
          <button
            type="button"
            onClick={onOpenSetup}
            className="inline-flex items-center gap-2 border border-gray-2 bg-white px-3 py-2 text-sm font-medium text-graphite transition-colors hover:border-gray-3 hover:text-tr-orange"
          >
            <Settings className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Settings</span>
          </button>
        )}
      </div>
    </header>
  )
}
