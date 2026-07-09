import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Design Signal — design review, on the spot",
  description:
    "Instant, principle-grounded design feedback for live meetings. Upload an artifact, pick your analysis lenses, and get tiered, location-anchored critique.",
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
      <body>{children}</body>
    </html>
  )
}
