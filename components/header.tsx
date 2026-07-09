"use client"

import { KeyRound, Check } from "lucide-react"

interface HeaderProps {
  tokenSet?: boolean
  onManageToken?: () => void
}

export function Header({ tokenSet = false, onManageToken }: HeaderProps) {
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
              Design Signal
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-4">
              design review, on the spot
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onManageToken && (
            <button
              type="button"
              onClick={onManageToken}
              className="inline-flex items-center gap-1.5 border border-gray-3 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-graphite transition-colors hover:bg-gray-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tr-orange focus-visible:ring-offset-1"
            >
              {tokenSet ? (
                <Check className="h-3.5 w-3.5 text-racing-green" aria-hidden />
              ) : (
                <KeyRound className="h-3.5 w-3.5 text-tr-orange" aria-hidden />
              )}
              {tokenSet ? "Token set" : "Add token"}
            </button>
          )}
          <span className="inline-flex items-center border border-racing-green px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-racing-green">
            Prototype
          </span>
        </div>
      </div>
    </header>
  )
}
