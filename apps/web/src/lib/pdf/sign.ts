// Stamps signatures onto PDF pages with pdf-lib, entirely in the browser.

import { PdfEngineError, runPdfJob } from "@/lib/pdf/engine"
import { openPdf } from "@/lib/pdf/pdfjs"

/**
 * Where a signature sits on a page, as fractions of the page as the user sees it
 * (0,0 = top-left corner, 1,1 = bottom-right), so it doesn't depend on screen size.
 */
export interface Placement {
  id: string
  /** 1-based page number */
  page: number
  x: number
  y: number
  w: number
  h: number
}

/**
 * Opens the file with pdf-lib. pdf-lib can't read encrypted files, but many PDFs (bank
 * statements, official forms) are encrypted with only an "owner password" that blocks editing,
 * not opening. Our Rust engine unlocks those, keeping pages, rotation and form fields,
 * and pdf-lib then works on the unlocked copy.
 */
async function openForEditing(file: File, pageCount: number, signal: AbortSignal) {
  const { PDFDocument } = await import("pdf-lib")
  // Ask pdf-lib whether the file is encrypted, rather than reading its error messages
  let peek
  try {
    peek = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true })
  } catch {
    throw new PdfEngineError(`"${file.name}" doesn't look like a valid PDF, or it is damaged.`)
  }
  if (!peek.isEncrypted) return peek

  const pages = Array.from({ length: pageCount }, (_, i) => ({ doc: 0, page: i + 1, rotate: 0 }))
  const unlocked = await runPdfJob({ kind: "assemble", files: [file], pages }, { signal })
  return PDFDocument.load(unlocked)
}

/**
 * Converts each placement from "as seen on screen" to the PDF's own coordinates with pdf.js
 * (which knows about page rotation and crop boxes), then draws the signature there with pdf-lib.
 */
export async function stampSignatures(
  file: File,
  signaturePng: string,
  placements: Placement[],
  signal: AbortSignal
): Promise<Uint8Array> {
  const { degrees } = await import("pdf-lib")
  const preview = await openPdf(file)
  const pdf = await openForEditing(file, preview.numPages, signal)
  signal.throwIfAborted()

  try {
    const image = await pdf.embedPng(signaturePng)

    for (const placement of placements) {
      const viewport = (await preview.getPage(placement.page)).getViewport({ scale: 1 })
      const toPdf = (fx: number, fy: number) => {
        const [x, y] = viewport.convertToPdfPoint(fx * viewport.width, fy * viewport.height)
        return { x, y }
      }
      // three corners of the signature as the user sees it
      const bottomLeft = toPdf(placement.x, placement.y + placement.h)
      const bottomRight = toPdf(placement.x + placement.w, placement.y + placement.h)
      const topLeft = toPdf(placement.x, placement.y)

      const width = Math.hypot(bottomRight.x - bottomLeft.x, bottomRight.y - bottomLeft.y)
      const height = Math.hypot(topLeft.x - bottomLeft.x, topLeft.y - bottomLeft.y)
      // on a rotated page "right" on screen points another way in PDF space; turn the image to match
      const angle = (Math.atan2(bottomRight.y - bottomLeft.y, bottomRight.x - bottomLeft.x) * 180) / Math.PI

      pdf.getPage(placement.page - 1).drawImage(image, {
        x: bottomLeft.x,
        y: bottomLeft.y,
        width,
        height,
        rotate: degrees(angle),
      })
    }

    return await pdf.save()
  } catch {
    // pdf-lib's own messages are written for developers, not for the people using Toolbox
    throw new PdfEngineError("The signature couldn't be added to this PDF. Please try again.")
  }
}
