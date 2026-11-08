// The cut-out Web Worker: finds the person or object in a photo with a small AI model (RMBG-1.4),
// entirely on this device. The model (about 42 MB) downloads once, then the browser keeps it.

import { AutoModel, AutoProcessor, env, RawImage } from "@huggingface/transformers"
import type { CutoutRequest, CutoutResponse } from "@/lib/image/cutout"

const MODEL = "briaai/RMBG-1.4"

// The runtime that runs the model is served by this site (see scripts/copy-engines.mjs)
env.allowLocalModels = false
env.backends.onnx.wasm!.wasmPaths = `${self.location.origin}/ort/`

const post = (message: CutoutResponse, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(message, transfer)

self.onmessage = async (event: MessageEvent<CutoutRequest>) => {
  const { id, file } = event.data
  try {
    // download progress, added up over the model's files
    const sizes = new Map<string, { loaded: number; total: number }>()
    const progress_callback = (info: { status: string; file?: string; loaded?: number; total?: number }) => {
      if (info.status !== "progress" || !info.file || !info.total) return
      sizes.set(info.file, { loaded: info.loaded ?? 0, total: info.total })
      let loaded = 0
      let total = 0
      for (const size of sizes.values()) {
        loaded += size.loaded
        total += size.total
      }
      post({ id, stage: "download", loaded, total })
    }

    const [model, processor] = await Promise.all([
      AutoModel.from_pretrained(MODEL, { config: { model_type: "custom" } as never, dtype: "q8", device: "wasm", progress_callback }),
      AutoProcessor.from_pretrained(MODEL, { progress_callback }),
    ])
    post({ id, stage: "thinking" })

    // Read the photo the way it is shown, with phone photos turned upright, so the mask lines up
    // with the picture the person sees (and with composeCutout, which turns it the same way)
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const context = canvas.getContext("2d")!
    context.drawImage(bitmap, 0, 0)
    bitmap.close()
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    const image = new RawImage(pixels.data, canvas.width, canvas.height, 4)
    const { pixel_values } = await processor(image)
    const { output } = await model({ input: pixel_values })
    // the model answers at 1024 × 1024; stretch its answer back to the photo's own size
    const mask = await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(image.width, image.height)
    const alpha = new Uint8Array(mask.data.length)
    alpha.set(mask.data)
    post({ id, ok: true, alpha, width: image.width, height: image.height }, [alpha.buffer])
  } catch (error) {
    post({ id, ok: false, message: error instanceof Error ? error.message : String(error) })
  }
}
