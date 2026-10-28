"use client"

import { useCallback, useRef, useState } from "react"
import SignaturePad from "signature_pad"
import { Eraser, ImageUp, PenLine, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export interface Signature {
  /** PNG with a transparent background, cropped to the ink */
  url: string
  width: number
  height: number
}

const INKS = [
  { name: "Black", value: "#1e2433" },
  { name: "Blue", value: "#1d4ed8" },
  { name: "Red", value: "#b91c1c" },
] as const

/** Crops a canvas to the area that has ink on it, with a little breathing room */
function cropToInk(source: HTMLCanvasElement): Signature | null {
  const ctx = source.getContext("2d")!
  const { width, height } = source
  const pixels = ctx.getImageData(0, 0, width, height).data
  let top = height
  let left = width
  let right = -1
  let bottom = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] > 10) {
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }
  if (right < 0) return null
  const pad = Math.round(Math.min(width, height) * 0.03)
  left = Math.max(0, left - pad)
  top = Math.max(0, top - pad)
  right = Math.min(width - 1, right + pad)
  bottom = Math.min(height - 1, bottom + pad)

  const out = document.createElement("canvas")
  out.width = right - left + 1
  out.height = bottom - top + 1
  out.getContext("2d")!.drawImage(source, left, top, out.width, out.height, 0, 0, out.width, out.height)
  return { url: out.toDataURL("image/png"), width: out.width, height: out.height }
}

/** Loads an uploaded signature picture onto a canvas so it can be cropped like a drawn one */
async function signatureFromImage(file: File): Promise<Signature | null> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement("canvas")
  // keep huge photos manageable
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  // turn a white or light paper background transparent, so only the ink is stamped
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < image.data.length; i += 4) {
    const lightness = (image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3
    if (lightness > 200) image.data[i + 3] = 0
  }
  ctx.putImageData(image, 0, 0)
  return cropToInk(canvas)
}

export function SignatureDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: (signature: Signature) => void
}) {
  const padRef = useRef<SignaturePad | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const [ink, setInk] = useState<string>(INKS[0].value)
  const [empty, setEmpty] = useState(true)

  // Set the pad up when the canvas appears (the dialog mounts it on open) and clean up after.
  const attachPad = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    canvas.getContext("2d")!.scale(ratio, ratio)
    const pad = new SignaturePad(canvas, { penColor: INKS[0].value, minWidth: 1, maxWidth: 3.2 })
    pad.addEventListener("endStroke", () => setEmpty(pad.isEmpty()))
    padRef.current = pad
    canvasRef.current = canvas
    return () => {
      pad.off()
      padRef.current = null
      canvasRef.current = null
      setEmpty(true)
    }
  }, [])

  const chooseInk = (value: string) => {
    setInk(value)
    const pad = padRef.current
    if (!pad) return
    pad.penColor = value
    // recolour what is already drawn
    pad.fromData(pad.toData().map((stroke) => ({ ...stroke, penColor: value })))
  }

  const undo = () => {
    const pad = padRef.current
    if (!pad) return
    const strokes = pad.toData()
    strokes.pop()
    pad.fromData(strokes)
    setEmpty(pad.isEmpty())
  }

  const clear = () => {
    padRef.current?.clear()
    setEmpty(true)
  }

  const finish = (signature: Signature | null) => {
    if (!signature) {
      toast.error("We couldn't find a signature", { description: "Draw your signature, or upload a clear picture of it." })
      return
    }
    onDone(signature)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="size-5 text-primary" aria-hidden="true" />
            Draw your signature
          </DialogTitle>
          <DialogDescription>Use your mouse, finger or stylus. You can place it anywhere on the page next.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <canvas
            ref={attachPad}
            aria-label="Signature drawing area"
            className="h-52 w-full touch-none rounded-2xl border-2 border-dashed bg-white"
          />
          {/* the line people sign on */}
          <div aria-hidden="true" className="pointer-events-none absolute right-8 bottom-12 left-8 border-b border-slate-300" />
          {empty && (
            <p aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
              Sign here
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Ink:</span>
          {INKS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-label={`${option.name} ink`}
              aria-pressed={ink === option.value}
              onClick={() => chooseInk(option.value)}
              className={cn(
                "size-7 rounded-full border-2 transition-transform hover:scale-110",
                ink === option.value ? "scale-110 border-foreground ring-2 ring-ring/30" : "border-transparent"
              )}
              style={{ backgroundColor: option.value }}
            />
          ))}
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" size="sm" onClick={undo} disabled={empty}>
              <Undo2 />
              Undo
            </Button>
            <Button variant="ghost" size="sm" onClick={clear} disabled={empty}>
              <Eraser />
              Clear
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => uploadRef.current?.click()}>
            <ImageUp />
            Upload a picture instead
          </Button>
          <Button
            disabled={empty}
            onClick={() => finish(canvasRef.current ? cropToInk(canvasRef.current) : null)}
          >
            Use this signature
          </Button>
        </DialogFooter>

        <input
          ref={uploadRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (file) finish(await signatureFromImage(file))
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
