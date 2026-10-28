"use client"

import { useEffect, useRef, useState } from "react"
import { FileWarning } from "lucide-react"
import { cn } from "cn"
import { isRenderCancelled, openPdf, renderPage } from "@/lib/pdf/pdfjs"

/**
 * One page of a PDF drawn as a small picture. Draws only when it scrolls near the screen,
 * so a 200-page file doesn't render every page at once.
 */
export function PdfPageThumb({
  file,
  page,
  width = 140,
  rotate = 0,
  frame,
  className,
}: {
  file: File
  /** 1-based page number */
  page: number
  width?: number
  /** extra rotation to show, in degrees (shown with a smooth turn) */
  rotate?: number
  /** fixed frame shape (height / width) so tiles in a grid line up, whatever each page's shape */
  frame?: number
  className?: string
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<"waiting" | "ready" | "error">("waiting")
  const [aspect, setAspect] = useState(1.414) // A4 until we know better

  useEffect(() => {
    const box = boxRef.current
    const canvas = canvasRef.current
    if (!box || !canvas) return
    let cancelled = false

    const draw = async () => {
      try {
        const doc = await openPdf(file)
        const pdfPage = await doc.getPage(page)
        if (cancelled) return
        const size = await renderPage(pdfPage, canvas, width)
        if (cancelled) return
        setAspect(size.height / size.width)
        setState("ready")
      } catch (error) {
        // a newer render of this canvas replaced this one; that one will finish the job
        if (!cancelled && !isRenderCancelled(error)) setState("error")
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          draw()
        }
      },
      { rootMargin: "300px" }
    )
    observer.observe(box)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [file, page, width])

  // When turned sideways, shrink so the turned page still fits its box
  const sideways = Math.abs(rotate / 90) % 2 === 1
  const scale = sideways ? Math.min(1 / aspect, aspect) : 1

  return (
    <div
      ref={boxRef}
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{ aspectRatio: `1 / ${frame ?? Math.max(aspect, 1)}` }}
    >
      {state === "waiting" && <div className="absolute inset-1 animate-pulse rounded-md bg-muted" aria-hidden="true" />}
      {state === "error" && <FileWarning className="size-6 text-muted-foreground" aria-label="Preview not available" />}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn(
          "max-h-full max-w-full rounded-sm bg-white shadow-sm ring-1 ring-foreground/10 transition-[rotate,scale,opacity] duration-300 ease-out",
          state === "ready" ? "opacity-100" : "opacity-0"
        )}
        style={{ rotate: `${rotate}deg`, scale: String(scale) }}
      />
    </div>
  )
}
