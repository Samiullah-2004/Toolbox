// The PDF Web Worker: runs the Rust/WebAssembly engine off the main thread,
// so the page stays smooth while large files are processed.
// Each job gets its own worker (see lib/pdf/engine.ts), which is closed when the job ends.

import { zipSync } from "fflate"
import { assemble, openForPages, PdfWasmError } from "@/lib/pdf/pdf-wasm"
import type { EngineRequest, EngineResponse } from "@/lib/pdf/engine"

const reply = (message: EngineResponse, transfer: Transferable[] = []) =>
  (self as unknown as Worker).postMessage(message, transfer)

self.onmessage = async (event: MessageEvent<EngineRequest>) => {
  const { id, files: buffers } = event.data
  const files = buffers.map((buffer) => new Uint8Array(buffer))
  try {
    if (event.data.kind === "assemble") {
      const pdf = await assemble(files, event.data.pages)
      reply({ id, ok: true, bytes: pdf.buffer as ArrayBuffer }, [pdf.buffer])
    } else {
      // One PDF per page, packed into a ZIP. The file is read once, then each page is copied out.
      const { pages, names } = event.data
      const source = await openForPages(files[0])
      const entries: Record<string, Uint8Array> = {}
      try {
        for (let i = 0; i < pages.length; i++) {
          entries[names[i]] = source.extract(pages[i].page, pages[i].rotate)
          reply({ id, progress: (i + 1) / pages.length })
        }
      } finally {
        source.close()
      }
      // PDFs are already compressed, so store them in the ZIP without compressing again
      const zip = zipSync(entries, { level: 0 })
      reply({ id, ok: true, bytes: zip.buffer as ArrayBuffer }, [zip.buffer])
    }
  } catch (error) {
    if (error instanceof PdfWasmError) {
      reply({ id, ok: false, code: error.code, doc: error.doc })
    } else {
      reply({ id, ok: false, code: 0, doc: -1, message: error instanceof Error ? error.message : String(error) })
    }
  }
}
