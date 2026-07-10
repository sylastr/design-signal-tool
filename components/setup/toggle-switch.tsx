"use client"

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Accessible label describing what the switch controls. */
  label: string
}

/**
 * A compact on/off switch styled with TR tokens. On = racing green.
 * Used in Setup to toggle platform-level visibility ("shown" vs "hidden").
 */
export function ToggleSwitch({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
        checked ? "border-racing-green bg-racing-green" : "border-gray-3 bg-gray-2"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
        aria-hidden
      />
    </button>
  )
}
