// pdf.js (Mozilla's PDF renderer) for page previews: thumbnails, page counts and the sign view.
// Loaded on demand, only in the browser, the first time a PDF needs to be shown.

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist"

type PdfJs = typeof import("pdfjs-dist")

let pdfjs: Promise<PdfJs> | null = null

function loadPdfJs() {
  pdfjs ??= import("pdfjs-dist").then((lib) => {
    lib.GlobalWorkerOptions.workerPort = new Worker(new URL("../../workers/pdfjs.worker.ts", import.meta.url), {
      type: "module",
    })
    return lib
  })
  return pdfjs
}

// One open document per File, shared by every thumbnail of that file
const documents = new WeakMap<File, Promise<PDFDocumentProxy>>()

/** Opens a PDF for previewing. Rejects with "password" or "invalid" for files it can't show. */
export function openPdf(file: File): Promise<PDFDocumentProxy> {
  let doc = documents.get(file)
  if (!doc) {
    doc = (async () => {
      const lib = await loadPdfJs()
      // pdf.js takes ownership of the buffer, so give it its own copy
      const data = new Uint8Array(await file.arrayBuffer())
      try {
        return await lib.getDocument({ data }).promise
      } catch (error) {
        throw new Error(error instanceof Error && error.name === "PasswordException" ? "password" : "invalid")
      }
    })()
    documents.set(file, doc)
    // Let a later attempt retry instead of reusing a failure
    doc.catch(() => documents.delete(file))
  }
  return doc
}

/** Draws a page into a canvas, sized to `width` CSS pixels */
export async function renderPage(page: PDFPageProxy, canvas: HTMLCanvasElement, width: number) {
  const unscaled = page.getViewport({ scale: 1 })
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const viewport = page.getViewport({ scale: (width / unscaled.width) * ratio })
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  await page.render({ canvas, viewport }).promise
  return { width: viewport.width / ratio, height: viewport.height / ratio }
}

export type { PDFDocumentProxy, PDFPageProxy }
