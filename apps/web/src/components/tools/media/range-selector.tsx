"use client"

import { useState } from "react"
import { cn } from "cn"
import { formatTime, parseTime } from "@/lib/media/commands"

type Handle = "start" | "end"

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high)

/**
 * A timeline with two handles for choosing a part of a video or sound. Drag the handles, or focus one
 * and use the arrow keys (Shift for bigger steps). Anything drawn inside it (like the sound wave)
 * shows behind the chosen part.
 */
export function RangeSelector({
  duration,
  start,
  end,
  onChange,
  maxLength,
  playhead,
  onSeek,
  label,
  children,
  className,
}: {
  duration: number
  start: number
  end: number
  /** `moved` says which handle changed, so a player can jump to that moment */
  onChange: (start: number, end: number, moved: Handle) => void
  /** the chosen part can't be longer than this (seconds) */
  maxLength?: number
  /** where the player is right now (seconds) */
  playhead?: number | null
  /** the person clicked the timeline itself */
  onSeek?: (time: number) => void
  label: string
  children?: React.ReactNode
  className?: string
}) {
  const [dragging, setDragging] = useState<Handle | null>(null)
  const minLength = Math.min(0.2, duration)
  const percent = (time: number) => `${(time / duration) * 100}%`

  const move = (handle: Handle, time: number) => {
    if (handle === "start") {
      const next = clamp(time, maxLength ? Math.max(0, end - maxLength) : 0, end - minLength)
      onChange(next, end, "start")
    } else {
      const next = clamp(time, start + minLength, maxLength ? Math.min(duration, start + maxLength) : duration)
      onChange(start, next, "end")
    }
  }

  /** The time under the pointer, measured along the timeline */
  const timeAt = (clientX: number, timeline: HTMLElement) => {
    const box = timeline.getBoundingClientRect()
    return clamp((clientX - box.left) / box.width, 0, 1) * duration
  }

  const handleProps = (handle: Handle) => ({
    role: "slider" as const,
    tabIndex: 0,
    "aria-label": handle === "start" ? `${label}: start` : `${label}: end`,
    "aria-valuemin": handle === "start" ? 0 : start,
    "aria-valuemax": handle === "start" ? end : duration,
    "aria-valuenow": Number((handle === "start" ? start : end).toFixed(2)),
    "aria-valuetext": formatTime(handle === "start" ? start : end),
    onPointerDown: (event: React.PointerEvent) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(handle)
    },
    onPointerMove: (event: React.PointerEvent) => {
      if (dragging === handle) move(handle, timeAt(event.clientX, event.currentTarget.parentElement!))
    },
    onPointerUp: () => setDragging(null),
    onPointerCancel: () => setDragging(null),
    onKeyDown: (event: React.KeyboardEvent) => {
      const step = event.shiftKey ? 1 : 0.1
      const current = handle === "start" ? start : end
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") move(handle, current - step)
      else if (event.key === "ArrowRight" || event.key === "ArrowUp") move(handle, current + step)
      else return
      event.preventDefault()
    },
  })

  const grip = (handle: Handle) =>
    cn(
      "absolute inset-y-0 z-10 flex w-4 cursor-ew-resize touch-none items-center justify-center bg-primary text-primary-foreground outline-none transition-[box-shadow,transform] focus-visible:ring-4 focus-visible:ring-ring/50",
      handle === "start" ? "-translate-x-full rounded-l-lg" : "rounded-r-lg",
      dragging === handle && "scale-y-105 shadow-lg"
    )

  return (
    <div className={cn("select-none", className)}>
      <div
        className="relative h-20 overflow-visible rounded-xl bg-muted"
        onPointerDown={(event) => {
          // clicking the timeline (not a handle) jumps the player there
          if (event.target === event.currentTarget || (event.target as HTMLElement).dataset.track) onSeek?.(timeAt(event.clientX, event.currentTarget))
        }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-xl" data-track="true">
          {children}
          {/* dim what is left out */}
          <div className="pointer-events-none absolute inset-y-0 left-0 bg-background/70" style={{ width: percent(start) }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 bg-background/70" style={{ left: percent(end) }} />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 border-y-2 border-primary"
          style={{ left: percent(start), width: `${((end - start) / duration) * 100}%` }}
        />
        {playhead != null && playhead >= 0 && playhead <= duration && (
          <div className="pointer-events-none absolute inset-y-0 z-[5] w-0.5 bg-foreground/80" style={{ left: percent(playhead) }} />
        )}
        <div className={grip("start")} style={{ left: percent(start) }} {...handleProps("start")}>
          <span className="h-6 w-0.5 rounded-full bg-primary-foreground/80" aria-hidden="true" />
        </div>
        <div className={grip("end")} style={{ left: percent(end) }} {...handleProps("end")}>
          <span className="h-6 w-0.5 rounded-full bg-primary-foreground/80" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-1.5 flex justify-between px-1 text-[0.7rem] text-muted-foreground tabular-nums">
        <span>0:00</span>
        <span>{formatTime(duration, false)}</span>
      </div>
    </div>
  )
}

/** A time you can type, like 1:05.5. Wrong or out-of-range text goes back to the last good time. */
export function TimeField({
  id,
  label,
  value,
  min,
  max,
  onCommit,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  onCommit: (seconds: number) => void
}) {
  const [typed, setTyped] = useState<string | null>(null)
  const parsed = typed === null ? null : parseTime(typed)
  const invalid = typed !== null && (parsed === null || parsed < min || parsed > max)

  const commit = () => {
    if (parsed !== null && !invalid) onCommit(parsed)
    setTyped(null)
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        value={typed ?? formatTime(value)}
        inputMode="decimal"
        onChange={(event) => setTyped(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
        aria-invalid={invalid}
        className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-base tabular-nums outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15 aria-invalid:border-destructive sm:text-sm"
      />
    </div>
  )
}
