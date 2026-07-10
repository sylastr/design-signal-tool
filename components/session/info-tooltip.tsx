"use client"

import { useId, useState } from "react"
import { Info } from "lucide-react"

interface Props {
  /** Accessible name for the trigger, e.g. "About project context". */
  label: string
  /** Tooltip body text. */
  children: React.ReactNode
}

/**
 * Small info-icon trigger that reveals a tooltip on hover and keyboard focus.
 * Uses `role="tooltip"` with `aria-describedby` so assistive tech announces it.
 */
export function InfoTooltip({ label, children }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false)
        }}
        className="inline-flex items-center justify-center text-gray-3 transition-colors hover:text-tr-orange focus-visible:text-tr-orange focus-visible:outline-none"
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-[calc(100%+6px)] z-20 w-60 -translate-x-1/2 border border-gray-2 bg-graphite px-3 py-2 text-[11px] font-normal normal-case leading-relaxed tracking-normal text-white shadow-md"
        >
          {children}
        </span>
      )}
    </span>
  )
}
