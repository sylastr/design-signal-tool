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
  "ResizeObserver loop completed with undelivered notifications.",
]

function isResizeObserverNoise(message: unknown): boolean {
  return typeof message === "string" && RESIZE_OBSERVER_MESSAGES.some((m) => message.includes(m))
}

export function SuppressResizeObserverError() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isResizeObserverNoise(event.message)) {
        event.stopImmediatePropagation()
        event.preventDefault()
      }
    }
    // Capture phase so we intercept before the dev overlay's listener runs.
    window.addEventListener("error", onError, true)
    return () => window.removeEventListener("error", onError, true)
  }, [])

  return null
}
