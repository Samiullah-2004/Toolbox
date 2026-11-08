// The image Web Worker: decodes, resizes and re-encodes pictures off the main thread, so the page
// stays smooth even with big phone photos. One job per worker (see lib/image/image.ts).

import type { ImageRequest, ImageResponse } from "@/lib/image/image"

const post = (message: ImageResponse, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(message, transfer)

/** Output size for a picture of `width` × `height`, from what the person asked for */
function targetSize(width: number, height: number, request: ImageRequest) {
  const { resize } = request
  if (!resize) return { width, height }
  if (resize.mode === "exact" || resize.mode === "cover") return { width: resize.width, height: resize.height }
  // fit inside the box, keeping the shape; never make it bigger unless asked
  const scale = Math.min(resize.width / width, resize.height / height, resize.enlarge ? Infinity : 1)
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

async function render(source: ImageBitmap, width: number, height: number, request: ImageRequest) {
  // the browser's best resampling, which is much sharper than one big drawImage step
  // "cover" fills the whole size and cuts off what sticks out, evenly on both sides
  let crop = { x: 0, y: 0, width: source.width, height: source.height }
  if (request.resize?.mode === "cover") {
    const scale = Math.max(width / source.width, height / source.height)
    const cropWidth = Math.round(width / scale)
    const cropHeight = Math.round(height / scale)
    crop = { x: Math.round((source.width - cropWidth) / 2), y: Math.round((source.height - cropHeight) / 2), width: cropWidth, height: cropHeight }
  }
  const scaled =
    width === source.width && height === source.height && crop.width === source.width && crop.height === source.height
      ? source
      : await createImageBitmap(source, crop.x, crop.y, crop.width, crop.height, { resizeWidth: width, resizeHeight: height, resizeQuality: "high" })
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext("2d")!
  // JPG has no see-through parts, so fill them (white unless the person chose a colour)
  if (request.type === "image/jpeg" || request.background) {
    context.fillStyle = request.background ?? "#ffffff"
    context.fillRect(0, 0, width, height)
  }
  context.drawImage(scaled, 0, 0)
  if (scaled !== source) scaled.close()
  return canvas
}

const encode = (canvas: OffscreenCanvas, type: string, quality?: number) => canvas.convertToBlob({ type, quality })

/**
 * Finds the best quality that still fits in `target` bytes. When even low quality is too big,
 * the picture is made a little smaller and tried again, as photos look far worse below ~35% quality.
 */
async function fitInSize(source: ImageBitmap, request: ImageRequest, target: number) {
  let { width, height } = targetSize(source.width, source.height, request)
  let smallest: { blob: Blob; width: number; height: number } | null = null

  for (let round = 0; round < 8; round++) {
    const canvas = await render(source, width, height, request)
    let low = 0.35
    let high = 0.95
    let best: Blob | null = null
    const top = await encode(canvas, request.type, high)
    if (top.size <= target) return { blob: top, width, height, fits: true }
    for (let step = 0; step < 6; step++) {
      const quality = (low + high) / 2
      const blob = await encode(canvas, request.type, quality)
      if (blob.size <= target) {
        best = blob
        low = quality
      } else {
        high = quality
      }
    }
    if (best) return { blob: best, width, height, fits: true }
    const floor = await encode(canvas, request.type, 0.35)
    if (!smallest || floor.size < smallest.blob.size) smallest = { blob: floor, width, height }
    if (floor.size <= target) return { blob: floor, width, height, fits: true }
    // shrink by how far off we are, but at least 15% and at most 50% per round
    const ratio = Math.min(0.85, Math.max(0.5, Math.sqrt(target / floor.size)))
    width = Math.max(16, Math.round(width * ratio))
    height = Math.max(16, Math.round(height * ratio))
  }
  return { ...smallest!, fits: false }
}

self.onmessage = async (event: MessageEvent<ImageRequest>) => {
  const request = event.data
  try {
    const source = await createImageBitmap(request.file, { imageOrientation: "from-image" })
    const result =
      request.targetBytes && request.type !== "image/png"
        ? await fitInSize(source, request, request.targetBytes)
        : await (async () => {
            const { width, height } = targetSize(source.width, source.height, request)
            const blob = await encode(await render(source, width, height, request), request.type, request.quality)
            return { blob, width, height, fits: true }
          })()
    source.close()
    const bytes = new Uint8Array(await result.blob.arrayBuffer())
    post({ id: request.id, ok: true, bytes, width: result.width, height: result.height, fits: result.fits }, [bytes.buffer])
  } catch (error) {
    post({ id: request.id, ok: false, message: error instanceof Error ? error.message : String(error) })
  }
}
