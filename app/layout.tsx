import type { Metadata, Viewport } from "next"
import "./globals.css"
import { SuppressResizeObserverError } from "@/components/suppress-resize-observer-error"

export const metadata: Metadata = {
  title: "Design Signal — design review, on the spot",
  description:
    "Instant, principle-grounded design feedback for live meetings. Upload an artifact, pick your analysis skills, and get tiered, location-anchored critique.",
}

export const viewport: Viewport = {
  themeColor: "#123015",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SuppressResizeObserverError />
        {children}
      </body>
    </html>
  )
}
