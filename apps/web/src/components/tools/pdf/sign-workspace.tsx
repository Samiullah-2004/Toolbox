"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, m } from "motion/react"
import { ChevronLeft, ChevronRight, Move, PenLine, Plus, RefreshCw, Trash2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { PdfPageThumb } from "@/components/tools/pdf/pdf-page-thumb"
import { SignatureDialog, type Signature } from "@/components/tools/pdf/signature-dialog"
import {
  ActionButton,
  FileDropzone,
  fileKey,
  ResultPanel,
  useToolFiles,
  useToolJob,
  WorkingPanel,
  WorkspaceFooter,
} from "@/components/tools/workspace-parts"
import { DropOverlay } from "@/components/upload/drop-overlay"
import { pdfProblem, usePdfInfo } from "@/hooks/use-pdf-info"
import { outputName } from "@/lib/download"
import { swapPreset } from "@/lib/motion"
import { isRenderCancelled, openPdf, renderPage } from "@/lib/pdf/pdfjs"
import { stampSignatures, type Placement } from "@/lib/pdf/sign"
import type { Tool } from "@/lib/tools"

/** Sign PDF: draw a signature and place it anywhere on any page */
export function SignWorkspace({ tool }: { tool: Tool }) {
  const { files, setFiles, dragging, fileInput, chooseFiles } = useToolFiles(tool)
  const { state, run, cancel, reset } = useToolJob()
  const infoOf = usePdfInfo(files)
  const file = files[0]
  const info = file ? infoOf(file) : null

  const startOver = () => {
    reset()
    setFiles([])
  }

  return (
    <div className="rounded-3xl border bg-card shadow-sm shadow-foreground/5">
      <DropOverlay active={dragging && state.status === "idle"} title="Drop a PDF to sign" description="It replaces the current file." />

      <AnimatePresence mode="wait" initial={false}>
        {state.status === "working" ? (
          <WorkingPanel key="working" label="Adding your signature" progress={state.progress} onCancel={cancel} />
        ) : state.status === "done" ? (
          <ResultPanel key="done" tool={tool} result={state.result} nextTools={["merge-pdf", "compress-pdf"]} onStartOver={startOver} />
        ) : !file ? (
          <m.div key="empty" {...swapPreset} className="p-4 sm:p-6">
            <FileDropzone tool={tool} onChoose={chooseFiles} />
          </m.div>
        ) : info?.status === "ready" ? (
          <SignBoard
            key={fileKey(file)}
            tool={tool}
            file={file}
            pageCount={info.pages}
            onReplace={chooseFiles}
            onApply={(signature, placements) =>
              run(async (signal) => {
                const bytes = await stampSignatures(file, signature.url, placements, signal)
                const pages = new Set(placements.map((p) => p.page)).size
                return {
                  bytes,
                  fileName: outputName(file.name, "signed"),
                  summary: `Signed in ${placements.length} ${placements.length === 1 ? "place" : "places"} on ${pages} ${pages === 1 ? "page" : "pages"}.`,
                }
              })
            }
          />
        ) : (
          <m.div key="reading" {...swapPreset} className="p-4 sm:p-6">
            {info?.status === "error" ? (
              <p className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                {pdfProblem(info)}
                <Button variant="outline" size="sm" className="ml-auto" onClick={chooseFiles}>
                  Choose another
                </Button>
              </p>
            ) : (
              <div className="h-96 animate-pulse rounded-2xl bg-muted" aria-busy="true" aria-label="Reading the PDF" />
            )}
          </m.div>
        )}
      </AnimatePresence>
      {fileInput}
    </div>
  )
}

function SignBoard({
  tool,
  file,
  pageCount,
  onReplace,
  onApply,
}: {
  tool: Tool
  file: File
  pageCount: number
  onReplace: () => void
  onApply: (signature: Signature, placements: Placement[]) => void
}) {
  const [page, setPage] = useState(1)
  const [signature, setSignature] = useState<Signature | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [placements, setPlacements] = useState<Placement[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  // the signature just added: it gets scrolled into view and keyboard focus
  const [justAdded, setJustAdded] = useState<string | null>(null)
  // width / height of the page being shown, needed to keep the signature's shape
  const [pageAspect, setPageAspect] = useState(0.707)

  const placeOnPage = (sig: Signature) => {
    const w = 0.32
    const h = (w * (sig.height / sig.width)) * pageAspect
    const placement = { id: crypto.randomUUID(), page, x: (1 - w) / 2, y: Math.min(0.78, 1 - h - 0.04), w, h }
    setPlacements((current) => [...current, placement])
    setSelected(placement.id)
    setJustAdded(placement.id)
  }

  const onSignatureReady = (sig: Signature) => {
    const previous = signature
    setSignature(sig)
    if (!previous) {
      // the first time, put it straight on the page so the next step is obvious
      placeOnPage(sig)
      return
    }
    // A redrawn signature keeps every spot and takes its new shape. If the new shape is too tall
    // for the space below it, shrink width and height together so it is never squashed.
    const change = sig.height / sig.width / (previous.height / previous.width)
    setPlacements((current) =>
      current.map((p) => {
        const h = p.h * change
        const fit = Math.min(1, (1 - p.y) / h)
        return { ...p, w: p.w * fit, h: h * fit }
      })
    )
  }

  const update = (id: string, next: Partial<Placement>) =>
    setPlacements((current) => current.map((p) => (p.id === id ? { ...p, ...next } : p)))
  const remove = (id: string) => {
    setPlacements((current) => current.filter((p) => p.id !== id))
    setSelected(null)
  }

  const onThisPage = placements.filter((p) => p.page === page)
  const pagesWithSignature = new Set(placements.map((p) => p.page))

  return (
    <m.div key="board" {...swapPreset}>
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-2.5 pr-3">
          <PdfPageThumb file={file} page={1} width={40} className="w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {pageCount} {pageCount === 1 ? "page" : "pages"}
              {placements.length > 0 && ` · signed in ${placements.length} ${placements.length === 1 ? "place" : "places"}`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onReplace}>
            <RefreshCw />
            Replace
          </Button>
        </div>

        {/* signature controls */}
        <div className="flex flex-wrap items-center gap-2">
          {signature ? (
            <>
              <span className="flex h-11 items-center rounded-xl border bg-white px-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
                <img src={signature.url} alt="Your signature" className="h-7 w-auto" />
              </span>
              <Button onClick={() => placeOnPage(signature)}>
                <Plus />
                Add to page {page}
              </Button>
              <Button variant="ghost" onClick={() => setDialogOpen(true)}>
                <PenLine />
                Redraw
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={() => setDialogOpen(true)} className="group">
              <PenLine className="transition-transform group-hover:-rotate-12" />
              Create your signature
            </Button>
          )}
        </div>

        {/* page navigation */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="icon" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft />
          </Button>
          <p className="text-sm font-medium tabular-nums" aria-live="polite">
            Page {page} of {pageCount}
          </p>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next page"
            disabled={page === pageCount}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight />
          </Button>
        </div>

        <PageCanvas
          file={file}
          page={page}
          onAspect={setPageAspect}
          placements={onThisPage}
          signature={signature}
          selected={selected}
          justAdded={justAdded}
          onSelect={setSelected}
          onChange={update}
          onRemove={remove}
        />

        {placements.length > 0 && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Move className="size-3.5" aria-hidden="true" />
            Drag the signature to move it, drag its corner to resize. Arrow keys work too.
          </p>
        )}

        {pageCount > 1 && (
          <ul className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" aria-label="Pages">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <li key={n} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setPage(n)}
                  aria-label={`Show page ${n}${pagesWithSignature.has(n) ? " (signed)" : ""}`}
                  aria-current={n === page ? "page" : undefined}
                  className={cn(
                    "relative w-16 rounded-lg border-2 p-0.5 transition-all",
                    n === page ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <PdfPageThumb file={file} page={n} width={60} className="w-full" />
                  <span className="block text-center text-[0.7rem] tabular-nums">{n}</span>
                  {pagesWithSignature.has(n) && (
                    <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-success text-white">
                      <PenLine className="size-2.5" aria-hidden="true" />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <WorkspaceFooter tool={tool}>
        <ActionButton
          ready={!!signature && placements.length > 0}
          onClick={() => {
            if (!signature) return
            onApply(signature, placements)
          }}
        >
          {tool.actionLabel}
        </ActionButton>
      </WorkspaceFooter>

      <SignatureDialog open={dialogOpen} onOpenChange={setDialogOpen} onDone={onSignatureReady} />
    </m.div>
  )
}

/** One page, big, with the signatures on it that can be dragged, resized and nudged */
function PageCanvas({
  file,
  page,
  onAspect,
  placements,
  signature,
  selected,
  justAdded,
  onSelect,
  onChange,
  onRemove,
}: {
  file: File
  page: number
  onAspect: (aspect: number) => void
  placements: Placement[]
  signature: Signature | null
  selected: string | null
  justAdded: string | null
  onSelect: (id: string | null) => void
  onChange: (id: string, next: Partial<Placement>) => void
  onRemove: (id: string) => void
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  // Draw the page to fit the available width, and again if that width changes
  useEffect(() => {
    const frame = frameRef.current
    const canvas = canvasRef.current
    if (!frame || !canvas) return
    let cancelled = false
    let lastWidth = 0

    const draw = async () => {
      const width = Math.min(frame.clientWidth, 720)
      if (!width || Math.abs(width - lastWidth) < 8) return
      lastWidth = width
      const pdfPage = await (await openPdf(file)).getPage(page)
      if (cancelled) return
      const size = await renderPage(pdfPage, canvas, width)
      if (cancelled) return
      canvas.style.width = `${size.width}px`
      canvas.style.height = `${size.height}px`
      onAspect(size.width / size.height)
      setReady(true)
    }

    const observer = new ResizeObserver(() => {
      draw().catch((error) => {
        // flipping pages or resizing quickly cancels older renders on purpose
        if (!isRenderCancelled(error)) toast.error("This page couldn't be shown")
      })
    })
    observer.observe(frame)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [file, page, onAspect])

  return (
    <div ref={frameRef} className="flex justify-center rounded-2xl bg-muted/50 p-3 sm:p-5">
      <div className="relative" onPointerDown={(e) => e.target === e.currentTarget && onSelect(null)}>
        <canvas
          ref={canvasRef}
          aria-label={`Page ${page}`}
          className={cn("block rounded-sm bg-white shadow-lg transition-opacity duration-300", ready ? "opacity-100" : "opacity-0")}
        />
        {!ready && <div className="absolute inset-0 min-h-80 min-w-56 animate-pulse rounded-sm bg-muted" aria-hidden="true" />}
        {signature &&
          placements.map((placement) => (
            <SignatureBox
              key={placement.id}
              placement={placement}
              src={signature.url}
              selected={selected === placement.id}
              isNew={justAdded === placement.id}
              onSelect={() => onSelect(placement.id)}
              onChange={(next) => onChange(placement.id, next)}
              onRemove={() => onRemove(placement.id)}
            />
          ))}
      </div>
    </div>
  )
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function SignatureBox({
  placement,
  src,
  selected,
  isNew,
  onSelect,
  onChange,
  onRemove,
}: {
  placement: Placement
  src: string
  selected: boolean
  isNew: boolean
  onSelect: () => void
  onChange: (next: Partial<Placement>) => void
  onRemove: () => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)

  // A new signature may land below the fold on a tall page: bring it into view and give it
  // keyboard focus, so the user sees where it went and the arrow keys work right away.
  useEffect(() => {
    if (!isNew) return
    const box = boxRef.current
    box?.focus({ preventScroll: true })
    box?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [isNew])

  // Dragging works in fractions of the page, so it doesn't matter how big the page is drawn
  const startDrag = (event: React.PointerEvent, mode: "move" | "resize") => {
    event.preventDefault()
    event.stopPropagation()
    onSelect()
    const page = boxRef.current?.parentElement?.getBoundingClientRect()
    if (!page) return
    const start = { px: event.clientX, py: event.clientY, ...placement }
    const ratio = placement.h / placement.w

    const onMove = (e: PointerEvent) => {
      const dx = (e.clientX - start.px) / page.width
      const dy = (e.clientY - start.py) / page.height
      if (mode === "move") {
        onChange({ x: clamp(start.x + dx, 0, 1 - start.w), y: clamp(start.y + dy, 0, 1 - start.h) })
      } else {
        const w = clamp(start.w + dx, 0.06, Math.min(1 - start.x, (1 - start.y) / ratio))
        onChange({ w, h: w * ratio })
      }
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  // Keyboard: arrows move, + and - resize, Delete removes. Shift moves further.
  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 0.05 : 0.01
    const ratio = placement.h / placement.w
    const moves: Record<string, Partial<Placement>> = {
      ArrowLeft: { x: clamp(placement.x - step, 0, 1 - placement.w) },
      ArrowRight: { x: clamp(placement.x + step, 0, 1 - placement.w) },
      ArrowUp: { y: clamp(placement.y - step, 0, 1 - placement.h) },
      ArrowDown: { y: clamp(placement.y + step, 0, 1 - placement.h) },
    }
    if (moves[event.key]) {
      event.preventDefault()
      onChange(moves[event.key])
    } else if (event.key === "+" || event.key === "=" || event.key === "-") {
      event.preventDefault()
      const w = clamp(placement.w + (event.key === "-" ? -step : step), 0.06, Math.min(1 - placement.x, (1 - placement.y) / ratio))
      onChange({ w, h: w * ratio })
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault()
      onRemove()
    }
  }

  return (
    <m.div
      ref={boxRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      role="group"
      tabIndex={0}
      aria-label="Signature. Arrow keys move it, plus and minus resize, Delete removes."
      onKeyDown={onKeyDown}
      onFocus={onSelect}
      onPointerDown={(e) => startDrag(e, "move")}
      className={cn(
        "absolute cursor-move touch-none rounded-md outline-none",
        selected ? "ring-2 ring-primary ring-offset-1" : "ring-1 ring-primary/40 ring-dashed hover:ring-2"
      )}
      style={{
        left: `${placement.x * 100}%`,
        top: `${placement.y * 100}%`,
        width: `${placement.w * 100}%`,
        height: `${placement.h * 100}%`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
      <img src={src} alt="" draggable={false} className="pointer-events-none size-full select-none" />
      {selected && (
        <>
          <button
            type="button"
            aria-label="Remove this signature"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            className="absolute -top-3 -right-3 flex size-7 items-center justify-center rounded-full bg-destructive text-white shadow-md transition-transform hover:scale-110"
          >
            <Trash2 className="size-3.5" />
          </button>
          <span
            aria-hidden="true"
            onPointerDown={(e) => startDrag(e, "resize")}
            className="absolute -right-2 -bottom-2 size-5 cursor-nwse-resize rounded-full border-2 border-white bg-primary shadow-md"
          />
        </>
      )}
    </m.div>
  )
}
