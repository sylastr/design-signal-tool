export function Header() {
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
        <span className="inline-flex items-center border border-racing-green px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-racing-green">
          Prototype
        </span>
      </div>
    </header>
  )
}
