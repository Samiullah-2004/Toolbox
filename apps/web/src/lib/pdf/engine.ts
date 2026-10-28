// Main-thread side of the PDF engine: sends jobs to the PDF Web Worker and turns
// its answers into results or friendly errors. A job can be cancelled with an AbortSignal.

import { PDF_ERROR, type PageRef } from "@/lib/pdf/pdf-wasm"

export type { PageRef }

export type EngineRequest =
  | { id: number; kind: "assemble"; files: ArrayBuffer[]; pages: PageRef[] }
  | { id: number; kind: "split-zip"; files: ArrayBuffer[]; pages: PageRef[]; names: string[] }

export type EngineResponse =
  | { id: number; progress: number }
  | { id: number; ok: true; bytes: ArrayBuffer }
  | { id: number; ok: false; code: number; doc: number; message?: string }

/** An error the user can understand, plus which file it is about (if any) */
export class PdfEngineError extends Error {
  constructor(
    message: string,
    readonly fileIndex: number = -1
  ) {
    super(message)
  }
}

function friendlyMessage(code: number, fileName?: string) {
  const file = fileName ? `"${fileName}"` : "This file"
  switch (code) {
    case PDF_ERROR.encrypted:
      return `${file} is protected with a password. Remove the password first, then try again.`
    case PDF_ERROR.invalid:
      return `${file} doesn't look like a valid PDF, or it is damaged.`
    case PDF_ERROR.pageOutOfRange:
      return "One of the chosen pages doesn't exist in the file."
    case PDF_ERROR.noPages:
      return "Choose at least one page."
    default:
      return "Oops, the toolbox got stuck. Please try again."
  }
}

let nextId = 1

// The request without its id, taking File objects instead of buffers (applied to each job kind)
type Job = EngineRequest extends infer Request
  ? Request extends EngineRequest
    ? Omit<Request, "id" | "files"> & { files: File[] }
    : never
  : never

/**
 * Runs a job in its own PDF worker and resolves with the result bytes.
 *
 * Every job gets a fresh worker that is closed when the job ends. Jobs on different pages
 * (Next.js keeps visited pages alive) can't interfere, cancelling one never touches another,
 * and the WebAssembly memory a big job used is given back afterwards.
 */
export async function runPdfJob(
  job: Job,
  { signal, onProgress }: { signal?: AbortSignal; onProgress?: (fraction: number) => void } = {}
): Promise<Uint8Array> {
  const files = await Promise.all(job.files.map((f) => f.arrayBuffer()))
  signal?.throwIfAborted()

  const id = nextId++
  const worker = new Worker(new URL("../../workers/pdf-engine.worker.ts", import.meta.url), { type: "module" })

  return new Promise<Uint8Array>((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener("abort", onAbort)
      worker.terminate()
    }
    const onAbort = () => {
      finish()
      reject(new DOMException("Cancelled", "AbortError"))
    }

    worker.onmessage = (event: MessageEvent<EngineResponse>) => {
      const data = event.data
      if (data.id !== id) return
      if ("progress" in data) {
        onProgress?.(data.progress)
        return
      }
      finish()
      if (data.ok) resolve(new Uint8Array(data.bytes))
      else reject(new PdfEngineError(friendlyMessage(data.code, job.files[data.doc]?.name), data.doc))
    }
    worker.onerror = () => {
      finish()
      reject(new PdfEngineError(friendlyMessage(0)))
    }
    signal?.addEventListener("abort", onAbort, { once: true })
    worker.postMessage({ ...job, id, files } as EngineRequest, files)
  })
}
