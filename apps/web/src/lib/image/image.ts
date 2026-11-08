// Image tools in the browser: resize and re-encode pictures in a Web Worker.
// Re-encoding also drops the photo's hidden details (camera, date, GPS location).

export type ImageType = "image/jpeg" | "image/png" | "image/webp"

export interface ImageRequest {
  id: number
  file: Blob
  type: ImageType
  /** 0 to 1, for JPG and WebP */
  quality?: number
  /** Aim for a file no bigger than this (JPG and WebP only) */
  targetBytes?: number
  resize?: {
    width: number
    height: number
    /**
     * "fit": inside the box, keeping the shape. "cover": exactly this size, cutting off the edges
     * that don't fit. "exact": exactly this size, stretched if the shape differs.
     */
    mode: "fit" | "cover" | "exact"
    /** allow making the picture bigger */
    enlarge?: boolean
  }
  /** Colour behind see-through parts */
  background?: string
}

export type ImageResponse =
  | { id: number; ok: true; bytes: Uint8Array; width: number; height: number; fits: boolean }
  | { id: number; ok: false; message: string }

export interface ImageResult {
  bytes: Uint8Array
  width: number
  height: number
  /** false when the target size couldn't be reached; the result is the smallest we could make */
  fits: boolean
}

/** An error whose message is safe to show to the user as it is */
export class ImageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ImageError"
  }
}

let nextId = 0

/** Resizes and re-encodes one picture. Each call gets its own worker, closed when it ends, so Cancel is a real stop. */
export function processImage(
  file: Blob,
  options: Omit<ImageRequest, "id" | "file">,
  signal?: AbortSignal
): Promise<ImageResult> {
  signal?.throwIfAborted()
  const id = nextId++
  const worker = new Worker(new URL("../../workers/image.worker.ts", import.meta.url), { type: "module" })
  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener("abort", onAbort)
      worker.terminate()
    }
    const onAbort = () => {
      finish()
      reject(new DOMException("Cancelled", "AbortError"))
    }
    worker.onmessage = (event: MessageEvent<ImageResponse>) => {
      if (event.data.id !== id) return
      finish()
      if (event.data.ok) resolve(event.data)
      else reject(new ImageError("This picture couldn't be read. It may be damaged, or in a format the browser can't open."))
    }
    worker.onerror = () => {
      finish()
      reject(new ImageError("The image engine couldn't start. Please reload the page and try again."))
    }
    signal?.addEventListener("abort", onAbort, { once: true })
    worker.postMessage({ ...options, id, file } satisfies ImageRequest)
  })
}

export interface ImageInfo {
  width: number
  height: number
}

/** Width and height of a picture, as it is shown (phone photos turned the right way up) */
export function readImageInfo(file: Blob): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
      URL.revokeObjectURL(url)
    }
    image.onerror = () => {
      reject(new ImageError("This picture couldn't be read."))
      URL.revokeObjectURL(url)
    }
    image.src = url
  })
}

export const extensionFor: Record<ImageType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }

/** The type a picture already has, or JPG */
export function typeOfImage(file: File): ImageType {
  if (file.type === "image/png" || /\.png$/i.test(file.name)) return "image/png"
  if (file.type === "image/webp" || /\.webp$/i.test(file.name)) return "image/webp"
  return "image/jpeg"
}

/**
 * Runs one picture after another, and packs the results in a ZIP when there are several.
 * `each` returns the bytes and the name for one picture.
 */
export async function runBatch(
  files: File[],
  each: (file: File, signal: AbortSignal) => Promise<{ bytes: Uint8Array; name: string }>,
  signal: AbortSignal,
  onProgress: (fraction: number) => void
) {
  const done: { bytes: Uint8Array; name: string }[] = []
  for (const [i, file] of files.entries()) {
    done.push(await each(file, signal))
    onProgress((i + 1) / files.length)
  }
  if (done.length === 1) return { single: done[0], all: done }
  return { zip: await zipFiles(done), all: done }
}

/** Packs files in one ZIP. Two files with the same name are kept apart: "photo.jpg", "photo (2).jpg". */
export async function zipFiles(files: { bytes: Uint8Array; name: string }[]) {
  const { zipSync } = await import("fflate")
  const used = new Map<string, number>()
  const entries: Record<string, Uint8Array> = {}
  for (const { bytes, name } of files) {
    const count = used.get(name) ?? 0
    used.set(name, count + 1)
    entries[count ? name.replace(/(\.[^.]+)$/, ` (${count + 1})$1`) : name] = bytes
  }
  // pictures are already compressed, so they go into the ZIP as they are
  return zipSync(entries, { level: 0 })
}
