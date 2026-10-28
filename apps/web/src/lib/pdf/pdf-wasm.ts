// Talks to the Rust PDF engine (packages/pdf-wasm) compiled to WebAssembly.
// Runs inside a PDF Web Worker, never on the main thread.
//
// WebAssembly functions only take numbers, so data travels through the module's memory.
// The request layout must match packages/pdf-wasm/src/ffi.rs.

export interface PageRef {
  /** index of the input file */
  doc: number
  /** 1-based page number in that file */
  page: number
  /** extra clockwise rotation: 0, 90, 180, 270 (or negative) */
  rotate: number
}

interface Exports {
  memory: WebAssembly.Memory
  alloc(len: number): number
  pdf_assemble(ptr: number, len: number): number
  pdf_page_count(ptr: number, len: number): number
  pdf_open(ptr: number, len: number): number
  pdf_extract(page: number, rotate: number): number
  pdf_close(): void
  output_ptr(): number
  output_len(): number
  free_output(): void
  last_error_doc(): number
}

/** Error codes from PdfError::code() in the Rust crate */
export const PDF_ERROR = {
  invalid: 1,
  encrypted: 2,
  pageOutOfRange: 3,
  noPages: 4,
  save: 5,
  badRequest: 6,
} as const

export class PdfWasmError extends Error {
  constructor(
    readonly code: number,
    /** which input file the problem is in, or -1 */
    readonly doc: number
  ) {
    super(`PDF engine error ${code} (file ${doc})`)
  }
}

let instance: Promise<Exports> | null = null

function load(): Promise<Exports> {
  instance ??= (async () => {
    // filled in once the module is ready; the import below only runs after that
    const ready: { exports?: Exports } = {}
    const imports = {
      env: {
        // Rust asks for random bytes through getrandom's custom backend
        fill_random(ptr: number, len: number) {
          crypto.getRandomValues(new Uint8Array(ready.exports!.memory.buffer, ptr, len))
        },
      },
    }
    const result = await WebAssembly.instantiateStreaming(fetch("/wasm/pdf_wasm.wasm"), imports)
    ready.exports = result.instance.exports as unknown as Exports
    return ready.exports
  })().catch((error) => {
    // don't keep a failed download around: the next job tries again
    instance = null
    throw error
  })
  return instance
}

/** Copies one file into WebAssembly memory. Rust takes ownership and frees it. */
function writeBytes(wasm: Exports, bytes: Uint8Array) {
  const ptr = wasm.alloc(bytes.length)
  // alloc can grow memory, so take a fresh view of the buffer after calling it
  new Uint8Array(wasm.memory.buffer, ptr, bytes.length).set(bytes)
  return ptr
}

/**
 * Writes an assemble request straight into WebAssembly memory: a header of numbers, then the
 * files. No extra copy is built in JavaScript first, so large merges need far less memory.
 */
function writeRequest(wasm: Exports, files: Uint8Array[], pages: PageRef[]) {
  const headerWords = 1 + files.length + 1 + pages.length * 3
  const total = headerWords * 4 + files.reduce((sum, f) => sum + f.length, 0)
  const ptr = wasm.alloc(total)
  const view = new DataView(wasm.memory.buffer, ptr, total)
  let pos = 0
  const word = (n: number) => {
    view.setUint32(pos, n >>> 0, true)
    pos += 4
  }
  word(files.length)
  files.forEach((f) => word(f.length))
  word(pages.length)
  pages.forEach((p) => {
    word(p.doc)
    word(p.page)
    word(p.rotate) // negative numbers go through as two's complement, read back as i32
  })
  const memory = new Uint8Array(wasm.memory.buffer, ptr, total)
  files.forEach((f) => {
    memory.set(f, pos)
    pos += f.length
  })
  return { ptr, len: total }
}

function takeOutput(wasm: Exports) {
  const result = new Uint8Array(wasm.memory.buffer, wasm.output_ptr(), wasm.output_len()).slice()
  wasm.free_output()
  return result
}

/** Builds a new PDF from the given pages of the given files */
export async function assemble(files: Uint8Array[], pages: PageRef[]): Promise<Uint8Array> {
  const wasm = await load()
  const { ptr, len } = writeRequest(wasm, files, pages)
  const status = wasm.pdf_assemble(ptr, len)
  if (status !== 0) throw new PdfWasmError(status, wasm.last_error_doc())
  return takeOutput(wasm)
}

/**
 * Reads a PDF once, then hands out single pages as separate PDFs.
 * Much faster than assembling each page from scratch on large files.
 */
export async function openForPages(file: Uint8Array) {
  const wasm = await load()
  const count = wasm.pdf_open(writeBytes(wasm, file), file.length)
  if (count < 0) throw new PdfWasmError(-count, 0)
  return {
    pageCount: count,
    extract(page: number, rotate = 0) {
      const status = wasm.pdf_extract(page, rotate)
      if (status !== 0) throw new PdfWasmError(status, 0)
      return takeOutput(wasm)
    },
    close: () => wasm.pdf_close(),
  }
}

/** Number of pages in a PDF */
export async function pageCount(file: Uint8Array): Promise<number> {
  const wasm = await load()
  const result = wasm.pdf_page_count(writeBytes(wasm, file), file.length)
  if (result < 0) throw new PdfWasmError(-result, 0)
  return result
}
