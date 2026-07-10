// Client-only helpers for turning uploaded files into artifact images or
// plain text. PDF rendering/extraction uses pdfjs-dist; Word (.docx) text
// extraction uses mammoth. Both are dynamically imported so they never run on
// the server and only load when the user actually uploads a file.

const MAX_PDF_PAGES = 12

type PdfModule = typeof import("pdfjs-dist")

let pdfjsPromise: Promise<PdfModule> | null = null

async function getPdfjs(): Promise<PdfModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      // Bundler-resolved worker URL (works with Turbopack/webpack).
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString()
      return pdfjs
    })
  }
  return pdfjsPromise
}

export function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

export function isDocx(file: File): boolean {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  )
}

export function isImage(file: File): boolean {
  return file.type.startsWith("image/")
}

/** Render each page of a PDF to a PNG data URL (capped at MAX_PDF_PAGES). */
export async function pdfToImages(file: File): Promise<{ name: string; dataUrl: string }[]> {
  const pdfjs = await getPdfjs()
  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buf }).promise
  const pageCount = Math.min(doc.numPages, MAX_PDF_PAGES)
  const base = file.name.replace(/\.pdf$/i, "")
  const out: { name: string; dataUrl: string }[] = []

  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement("canvas")
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext("2d")
    if (!ctx) continue
    await page.render({ canvas, canvasContext: ctx, viewport }).promise
    out.push({
      name: doc.numPages > 1 ? `${base} — p${i}` : base,
      dataUrl: canvas.toDataURL("image/png"),
    })
    page.cleanup()
  }

  return out
}

/** Extract plain text from a PDF, DOCX, or plain-text file. */
export async function extractTextFromFile(file: File): Promise<string> {
  if (isPdf(file)) {
    const pdfjs = await getPdfjs()
    const buf = await file.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: buf }).promise
    const parts: string[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
      if (text) parts.push(text)
      page.cleanup()
    }
    return parts.join("\n\n").trim()
  }

  if (isDocx(file)) {
    const mammoth = await import("mammoth/mammoth.browser")
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value.trim()
  }

  // Plain text (.txt, .md, and anything else readable as UTF-8).
  return (await file.text()).trim()
}
