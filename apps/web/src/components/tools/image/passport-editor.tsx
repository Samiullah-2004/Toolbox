"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Minus, Move, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { asJob, EditorWorkspace, type EditorProps } from "@/components/tools/editor-workspace"
import { ChoiceCards, Notice, SliderField } from "@/components/tools/media/media-parts"
import { ActionButton, WorkspaceFooter } from "@/components/tools/workspace-parts"
import { useObjectUrlRef } from "@/hooks/use-object-url-ref"
import { outputName } from "@/lib/download"
import { formatBytes } from "@/lib/format"
import { composeCutout, findSubject } from "@/lib/image/cutout"
import { ImageError, readImageInfo, type ImageInfo } from "@/lib/image/image"
import type { Tool } from "@/lib/tools"

const DPI = 300
const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI)

interface PhotoSize {
  id: string
  title: string
  text: string
  widthMm: number
  heightMm: number
  /** where the top of the head and the chin should be, as a share of the height */
  crown: number
  chin: number
}

const photoSizes: PhotoSize[] = [
  { id: "passport", title: "35 × 45 mm", text: "Passport, CNIC forms and most visas", widthMm: 35, heightMm: 45, crown: 0.1, chin: 0.8 },
  { id: "us", title: "2 × 2 inch", text: "US visa and passport", widthMm: 50.8, heightMm: 50.8, crown: 0.14, chin: 0.78 },
]

const backgrounds = [
  { value: "keep", title: "Keep as it is", text: "No change, nothing to download" },
  { value: "#ffffff", title: "White", text: "Most passports and visas" },
  { value: "#dce9f5", title: "Light blue", text: "Asked for by some forms" },
  { value: "#e7e7e7", title: "Light grey", text: "UK and some visas" },
]

/** The part of the photo inside the frame, in the photo's own pixels */
interface Crop {
  x: number
  y: number
  width: number
}

/** Writes 300 DPI into a JPG, so printers and photo shops print it at the right size */
function setJpegDpi(bytes: Uint8Array, dpi: number) {
  // A JPG from the browser starts with a JFIF block: units at byte 13, then x and y density
  if (String.fromCharCode(...bytes.subarray(6, 11)) === "JFIF\0") {
    bytes[13] = 1 // dots per inch
    bytes[14] = dpi >> 8
    bytes[15] = dpi & 255
    bytes[16] = dpi >> 8
    bytes[17] = dpi & 255
  }
  return bytes
}

function PassportEditor({ tool, files, chooseFiles, onRun }: EditorProps) {
  const file = files[0]
  const [info, setInfo] = useState<ImageInfo | null>(null)
  const [sizeId, setSizeId] = useState("passport")
  const [background, setBackground] = useState("#ffffff")
  const [output, setOutput] = useState<"single" | "sheet">("single")
  const [crop, setCrop] = useState<Crop | null>(null)
  const [frameWidth, setFrameWidth] = useState(0)
  const drag = useRef<{ x: number; y: number; crop: Crop } | null>(null)
  const imageRef = useObjectUrlRef<HTMLImageElement>(file)

  const size = photoSizes.find((s) => s.id === sizeId)!
  const aspect = size.widthMm / size.heightMm

  useEffect(() => {
    let current = true
    readImageInfo(file)
      .then((result) => current && setInfo(result))
      .catch(() => current && setInfo(null))
    return () => {
      current = false
    }
  }, [file])

  // How wide the frame is on screen, so the photo can be drawn at the right scale
  const frameRef = useCallback((element: HTMLDivElement | null) => {
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setFrameWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  /** The biggest crop of this shape that fits in the photo */
  const maxWidth = info ? Math.min(info.width, info.height * aspect) : 1
  const minWidth = maxWidth * 0.2

  /** Keeps the crop inside the photo */
  const clamp = (next: Crop): Crop => {
    if (!info) return next
    const width = Math.min(Math.max(next.width, minWidth), maxWidth)
    const height = width / aspect
    return {
      width,
      x: Math.min(Math.max(next.x, 0), info.width - width),
      y: Math.min(Math.max(next.y, 0), info.height - height),
    }
  }

  // Start with the largest crop, centred, near the top where the head usually is
  const startCrop = (): Crop => (info ? clamp({ width: maxWidth, x: (info.width - maxWidth) / 2, y: info.height * 0.03 }) : { x: 0, y: 0, width: 1 })
  const current = crop ? clamp(crop) : startCrop()
  const scale = frameWidth / current.width

  const zoomTo = (width: number) => {
    // zoom around the middle of the frame, so what you look at stays put
    const centreX = current.x + current.width / 2
    const centreY = current.y + current.width / aspect / 2
    setCrop(clamp({ width, x: centreX - width / 2, y: centreY - width / aspect / 2 }))
  }
  const zoom = maxWidth / current.width // 1 = whole width, bigger = closer

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = (event.shiftKey ? 0.1 : 0.02) * current.width
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (moves[event.key]) {
      // arrows move the photo inside the frame, like dragging it
      setCrop(clamp({ ...current, x: current.x - moves[event.key][0], y: current.y - moves[event.key][1] }))
    } else if (event.key === "+" || event.key === "=") {
      zoomTo(current.width / 1.1)
    } else if (event.key === "-") {
      zoomTo(current.width * 1.1)
    } else {
      return
    }
    event.preventDefault()
  }

  const photo = { width: mmToPx(size.widthMm), height: mmToPx(size.heightMm) }
  const sheet = { width: 6 * DPI, height: 4 * DPI, gap: Math.round(0.1 * DPI) }
  const columns = Math.floor((sheet.width + sheet.gap) / (photo.width + sheet.gap))
  const rows = Math.floor((sheet.height + sheet.gap) / (photo.height + sheet.gap))
  const copies = columns * rows

  const run = () =>
    onRun({
      working: background === "keep" ? "Making your photo" : "Changing the background",
      run: async (signal, onProgress) => {
        let source: CanvasImageSource
        if (background === "keep") {
          source = await createImageBitmap(file, { imageOrientation: "from-image" })
        } else {
          const mask = await findSubject(file, signal, (progress) =>
            onProgress(progress.stage === "download" ? (progress.loaded / Math.max(progress.total, 1)) * 0.85 : 0.9)
          )
          source = await composeCutout(file, mask, background)
        }
        signal.throwIfAborted()

        const single = document.createElement("canvas")
        single.width = photo.width
        single.height = photo.height
        const context = single.getContext("2d")!
        // JPG can't be see-through; without this, see-through parts (like a cut-out PNG) turn black
        context.fillStyle = "#ffffff"
        context.fillRect(0, 0, photo.width, photo.height)
        context.imageSmoothingQuality = "high"
        context.drawImage(source, current.x, current.y, current.width, current.width / aspect, 0, 0, photo.width, photo.height)

        let canvas = single
        if (output === "sheet") {
          canvas = document.createElement("canvas")
          canvas.width = sheet.width
          canvas.height = sheet.height
          const page = canvas.getContext("2d")!
          page.fillStyle = "#ffffff"
          page.fillRect(0, 0, sheet.width, sheet.height)
          const left = Math.round((sheet.width - (columns * photo.width + (columns - 1) * sheet.gap)) / 2)
          const top = Math.round((sheet.height - (rows * photo.height + (rows - 1) * sheet.gap)) / 2)
          for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {
              const x = left + column * (photo.width + sheet.gap)
              const y = top + row * (photo.height + sheet.gap)
              page.drawImage(single, x, y)
              // thin grey lines to cut along
              page.strokeStyle = "#c8c8c8"
              page.lineWidth = 1
              page.strokeRect(x - 0.5, y - 0.5, photo.width + 1, photo.height + 1)
            }
          }
        }

        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new ImageError("The photo couldn't be saved."))), "image/jpeg", 0.95)
        )
        const bytes = setJpegDpi(new Uint8Array(await blob.arrayBuffer()), DPI)
        return {
          bytes,
          fileName: outputName(file.name, output === "sheet" ? `${size.title} print sheet` : size.title, "jpg"),
          type: "image/jpeg",
          summary:
            output === "sheet"
              ? `${copies} photos of ${size.title} on a 4 × 6 inch sheet, ${formatBytes(bytes.length)}. Print it at "actual size" or at any photo shop.`
              : `A ${size.title} photo at ${DPI} DPI (${photo.width} × ${photo.height} pixels), ${formatBytes(bytes.length)}.`,
        }
      },
    })

  return (
    <>
      <div className="space-y-4 p-4 sm:p-6">
        <ChoiceCards
          name="passport-size"
          label="Photo size"
          value={sizeId}
          onChange={(id) => {
            setSizeId(id)
            setCrop(null) // a different shape needs a fresh crop
          }}
          className="sm:grid-cols-2"
          choices={photoSizes.map((s) => ({ value: s.id, title: s.title, text: s.text }))}
        />

        <div className="grid gap-4 md:grid-cols-[minmax(0,15rem)_1fr] md:items-start">
          <div className="mx-auto w-full max-w-60">
            <div
              ref={frameRef}
              tabIndex={0}
              role="group"
              aria-label="Photo framing. Drag the photo, or use the arrow keys to move it and plus or minus to zoom."
              onKeyDown={onKeyDown}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                drag.current = { x: event.clientX, y: event.clientY, crop: current }
              }}
              onPointerMove={(event) => {
                if (!drag.current) return
                const dx = (event.clientX - drag.current.x) / scale
                const dy = (event.clientY - drag.current.y) / scale
                setCrop(clamp({ ...drag.current.crop, x: drag.current.crop.x - dx, y: drag.current.crop.y - dy }))
              }}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
              className="relative w-full cursor-grab touch-none overflow-hidden rounded-lg bg-muted shadow-md outline-none ring-offset-2 ring-offset-card select-none focus-visible:ring-4 focus-visible:ring-ring/50 active:cursor-grabbing"
              style={{ aspectRatio: `${size.widthMm} / ${size.heightMm}` }}
            >
              {info && frameWidth > 0 && (
                // eslint-disable-next-line @next/next/no-img-element -- a local photo, moved by hand
                <img
                  ref={imageRef}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left"
                  style={{ width: info.width * scale, height: info.height * scale, translate: `${-current.x * scale}px ${-current.y * scale}px` }}
                />
              )}
              {/* where the head should be */}
              <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <ellipse
                  cx="50"
                  cy={((size.crown + size.chin) / 2) * 100}
                  rx="27"
                  ry={((size.chin - size.crown) / 2) * 100}
                  fill="none"
                  stroke="white"
                  strokeWidth="0.8"
                  strokeDasharray="3 2"
                  vectorEffect="non-scaling-stroke"
                  style={{ filter: "drop-shadow(0 0 1px rgb(0 0 0 / 0.6))" }}
                />
                {[size.crown, size.chin].map((line) => (
                  <line key={line} x1="0" x2="100" y1={line * 100} y2={line * 100} stroke="white" strokeOpacity="0.8" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />
                ))}
              </svg>
              <span className="pointer-events-none absolute right-1 rounded bg-black/50 px-1 text-[0.6rem] text-white" style={{ top: `calc(${size.crown * 100}% - 1.1rem)` }}>
                Top of head
              </span>
              <span className="pointer-events-none absolute right-1 rounded bg-black/50 px-1 text-[0.6rem] text-white" style={{ top: `calc(${size.chin * 100}% + 0.2rem)` }}>
                Chin
              </span>
            </div>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Move className="size-3.5" aria-hidden="true" />
              Drag the photo to place your face in the oval
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <Button variant="outline" size="icon" aria-label="Zoom out" onClick={() => zoomTo(current.width * 1.15)} disabled={zoom <= 1.001}>
                <Minus />
              </Button>
              <div className="flex-1">
                <SliderField
                  id="passport-zoom"
                  label="Zoom"
                  value={Math.round(zoom * 100)}
                  min={100}
                  max={500}
                  step={5}
                  display={`${Math.round(zoom * 100)}%`}
                  onChange={(value) => zoomTo(maxWidth / (value / 100))}
                />
              </div>
              <Button variant="outline" size="icon" aria-label="Zoom in" onClick={() => zoomTo(current.width / 1.15)} disabled={zoom >= 4.99}>
                <Plus />
              </Button>
            </div>
            <Notice>
              Place the top of your head on the upper line and your chin on the lower one. Look straight at the camera, with your
              eyes open and nothing covering your face.
            </Notice>
            <ChoiceCards name="passport-background" label="Background" value={background} onChange={setBackground} className="grid-cols-2" choices={backgrounds} />
            {background !== "keep" && (
              <Notice>Changing the background uses a small AI model on your device. The first time, it downloads once (about 42 MB).</Notice>
            )}
            <ChoiceCards
              name="passport-output"
              label="What to save"
              value={output}
              onChange={setOutput}
              className="sm:grid-cols-2"
              choices={[
                { value: "single", title: "One photo", text: "For uploading to online forms" },
                { value: "sheet", title: `Print sheet (${copies} photos)`, text: "4 × 6 inch, for any photo shop" },
              ]}
            />
          </div>
        </div>
      </div>
      <WorkspaceFooter tool={tool}>
        <Button variant="ghost" size="lg" onClick={chooseFiles}>
          Another photo
        </Button>
        <ActionButton ready={!!info} onClick={run}>
          {tool.actionLabel}
        </ActionButton>
      </WorkspaceFooter>
    </>
  )
}

export const PassportPhotoWorkspace = ({ tool }: { tool: Tool }) => (
  <EditorWorkspace tool={tool} Editor={PassportEditor} toJob={asJob} next={["compress-image", "resize-image"]} />
)
