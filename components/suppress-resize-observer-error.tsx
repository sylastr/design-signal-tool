"use client"

import { useEffect } from "react"

/**
 * "ResizeObserver loop completed with undelivered notifications" is a benign
 * browser notification (not a real error) that fires when a ResizeObserver
 * callback causes layout changes — e.g. smooth `scrollIntoView` inside a
 * scroll container. It has no user-facing impact, but Next.js's dev overlay
 * surfaces it as an uncaught runtime error. This mutes ONLY that exact message
 * so it doesn't trip the overlay, while leaving all other errors untouched.
 */
const RESIZE_OBSERVER_MESSAGES = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
]

function isResizeObserverNoise(value: unknown): boolean {
  const message =
    typeof value === "string"
      ? value
      : value instanceof Error
        ? value.message
        : typeof (value as { message?: unknown })?.message === "string"
          ? ((value as { message: string }).message)
          : ""
  return RESIZE_OBSERVER_MESSAGES.some((m) => message.includes(m))
}

// Register synchronously at module load so the listeners exist before any
// observer callback runs and before the dev overlay attaches its own handlers.
if (typeof window !== "undefined") {
  const w = window as typeof window & { __roNoiseSilenced?: boolean }
  if (!w.__roNoiseSilenced) {
    w.__roNoiseSilenced = true

    const swallow = (event: ErrorEvent) => {
      if (isResizeObserverNoise(event.message) || isResizeObserverNoise(event.error)) {
        event.stopImmediatePropagation()
        event.preventDefault()
      }
    }
    // Capture phase so we intercept before the dev overlay's listener runs.
    window.addEventListener("error", swallow, true)

    // Next.js's dev overlay also mirrors runtime errors through console.error,
    // so filter that exact message there too.
    const originalConsoleError = console.error.bind(console)
    console.error = (...args: unknown[]) => {
      if (args.some((arg) => isResizeObserverNoise(arg))) return
      originalConsoleError(...args)
    }
  }
}

export function SuppressResizeObserverError() {
  // No-op effect kept so the component participates in the render tree; the
  // real work happens once at module load above.
  useEffect(() => {}, [])
  return null
}
