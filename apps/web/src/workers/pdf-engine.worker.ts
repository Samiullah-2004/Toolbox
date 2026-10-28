// The PDF Web Worker: runs the Rust/WebAssembly engine off the main thread,
// so the page stays smooth while large files are processed.

import { zipSync } from "fflate"
import { assemble, PdfWasmError, type PageRef } from "@/lib/pdf/pdf-wasm"
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
      // One PDF per page, packed into a ZIP
      const entries: Record<string, Uint8Array> = {}
      const { pages, names } = event.data
      for (let i = 0; i < pages.length; i++) {
        entries[names[i]] = await assemble(files, [pages[i] as PageRef])
        reply({ id, progress: (i + 1) / pages.length })
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
