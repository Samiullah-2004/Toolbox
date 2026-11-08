// Removes the background from a photo, on this device (see workers/cutout.worker.ts).

import { ImageError } from "@/lib/image/image"

export interface CutoutRequest {
  id: number
  file: Blob
}

export type CutoutResponse =
  | { id: number; stage: "download"; loaded: number; total: number }
  | { id: number; stage: "thinking" }
  | { id: number; ok: true; alpha: Uint8Array; width: number; height: number }
  | { id: number; ok: false; message: string }

/** How sure the model is, for each pixel: 255 = the subject, 0 = background */
export interface CutoutMask {
  alpha: Uint8Array
  width: number
  height: number
}

export type CutoutProgress = { stage: "download"; loaded: number; total: number } | { stage: "thinking" }

let nextId = 0

export function findSubject(file: Blob, signal?: AbortSignal, onProgress?: (progress: CutoutProgress) => void): Promise<CutoutMask> {
  signal?.throwIfAborted()
  const id = nextId++
  const worker = new Worker(new URL("../../workers/cutout.worker.ts", import.meta.url), { type: "module" })
  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener("abort", onAbort)
      worker.terminate()
    }
    const onAbort = () => {
      finish()
      reject(new DOMException("Cancelled", "AbortError"))
    }
    worker.onmessage = (event: MessageEvent<CutoutResponse>) => {
      const data = event.data
      if (data.id !== id) return
      if ("stage" in data) {
        onProgress?.(data)
        return
      }
      finish()
      if (data.ok) {
        resolve(data)
      } else {
        console.error("Cut-out failed:", data.message)
        reject(
          new ImageError(
            /fetch|network|load/i.test(data.message)
              ? "The cut-out model couldn't be downloaded. Check your internet connection and try again."
              : /memory|allocat/i.test(data.message)
                ? "Your device ran out of memory. Try a smaller photo."
                : "The background couldn't be removed from this picture. Try another photo."
          )
        )
      }
    }
    worker.onerror = () => {
      finish()
      reject(new ImageError("The cut-out engine couldn't start. Please reload the page and try again."))
    }
    signal?.addEventListener("abort", onAbort, { once: true })
    worker.postMessage({ id, file } satisfies CutoutRequest)
  })
}

/**
 * Puts the cut-out on a new background: a colour, or nothing (see-through).
 * Returns a canvas the size of the photo, ready to save or crop.
 */
export async function composeCutout(file: Blob, mask: CutoutMask, background: string | null) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  const canvas = document.createElement("canvas")
  canvas.width = mask.width
  canvas.height = mask.height
  const context = canvas.getContext("2d")!
  context.drawImage(bitmap, 0, 0, mask.width, mask.height)
  bitmap.close()

  const pixels = context.getImageData(0, 0, mask.width, mask.height)
  for (let i = 0; i < mask.alpha.length; i++) pixels.data[i * 4 + 3] = mask.alpha[i]
  context.putImageData(pixels, 0, 0)

  if (background) {
    // paint the colour behind the subject
    context.globalCompositeOperation = "destination-over"
    context.fillStyle = background
    context.fillRect(0, 0, mask.width, mask.height)
    context.globalCompositeOperation = "source-over"
  }
  return canvas
}

/** The box around the subject (where the mask is mostly sure), or null when nothing was found */
export function subjectBox(mask: CutoutMask) {
  let top = -1
  let bottom = -1
  let left = mask.width
  let right = -1
  for (let y = 0; y < mask.height; y++) {
    const row = y * mask.width
    for (let x = 0; x < mask.width; x++) {
      if (mask.alpha[row + x] > 128) {
        if (top < 0) top = y
        bottom = y
        if (x < left) left = x
        if (x > right) right = x
      }
    }
  }
  return top < 0 ? null : { top, bottom, left, right }
}
