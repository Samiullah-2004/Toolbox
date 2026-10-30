"use client"

// Small building blocks shared by the audio and video tools.

import { useCallback, useState } from "react"
import { m } from "motion/react"
import { Film, Music, RefreshCw, TriangleAlert } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { useObjectUrlRef } from "@/hooks/use-object-url-ref"
import { formatBytes } from "@/lib/format"
import { formatTime } from "@/lib/media/commands"
import { probeMedia } from "@/lib/media/ffmpeg"

/** A player for the chosen file. Reports its length, and works out the length itself when the browser can't play it. */
export function MediaPreview({
  file,
  kind,
  onDuration,
  onTime,
  onPlay,
  mediaRef,
  className,
}: {
  file: File
  kind: "video" | "audio"
  onDuration: (seconds: number) => void
  /** the playing position, while it plays or is moved */
  onTime?: (seconds: number) => void
  /** the person pressed play (a browser only lets sound be processed after that) */
  onPlay?: () => void
  /** lets the tool seek and read the playing position */
  mediaRef?: React.RefObject<HTMLMediaElement | null>
  className?: string
}) {
  const [cantPlay, setCantPlay] = useState(false)
  const srcRef = useObjectUrlRef<HTMLMediaElement>(file)
  const setRefs = useCallback(
    (element: HTMLMediaElement | null) => {
      if (mediaRef) mediaRef.current = element
      return srcRef(element)
    },
    [srcRef, mediaRef]
  )

  const giveUp = () => {
    setCantPlay(true)
    // Some formats (like iPhone HEVC video) can be converted even when the browser can't show them
    probeMedia(file)
      .then((info) => info.duration && onDuration(info.duration))
      .catch(() => {})
  }

  if (cantPlay) {
    return (
      <p className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        Your browser can&apos;t show a preview of this file, but Toolbox can still work with it.
      </p>
    )
  }

  const shared = {
    ref: setRefs,
    controls: true,
    preload: "metadata" as const,
    onLoadedMetadata: (event: React.SyntheticEvent<HTMLMediaElement>) => {
      if (Number.isFinite(event.currentTarget.duration)) onDuration(event.currentTarget.duration)
    },
    onTimeUpdate: (event: React.SyntheticEvent<HTMLMediaElement>) => onTime?.(event.currentTarget.currentTime),
    onPlay,
    onError: giveUp,
  }
  return kind === "video" ? (
    <video {...shared} playsInline className={cn("max-h-72 w-full rounded-xl bg-black", className)} />
  ) : (
    <audio {...shared} className={cn("w-full", className)} />
  )
}

/** The chosen file at the top of a tool: name, details and a way to pick another */
export function FileCard({
  file,
  kind,
  detail,
  onReplace,
}: {
  file: File
  kind: "video" | "audio"
  detail?: string
  onReplace: () => void
}) {
  const Icon = kind === "video" ? Film : Music
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-2.5 pr-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.size)}
          {detail && <> &middot; {detail}</>}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onReplace}>
        <RefreshCw />
        Replace
      </Button>
    </div>
  )
}

export interface Choice<T extends string | number> {
  value: T
  title: string
  text?: string
}

/** A row of big cards where exactly one is chosen */
export function ChoiceCards<T extends string | number>({
  label,
  value,
  onChange,
  choices,
  name,
  className,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  choices: Choice<T>[]
  /** keeps the sliding highlight of different groups apart */
  name: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("grid gap-2", className)}>
      {choices.map((choice) => {
        const on = choice.value === value
        return (
          <button
            key={choice.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(choice.value)}
            className={cn(
              "relative isolate rounded-2xl border p-3 text-left outline-none transition-colors hover:border-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/40",
              on && "border-primary"
            )}
          >
            {on && <m.span layoutId={`choice-${name}`} className="absolute inset-0 -z-10 rounded-2xl bg-primary/[0.06]" />}
            <span className="block text-sm font-semibold">{choice.title}</span>
            {choice.text && <span className="block text-xs text-muted-foreground">{choice.text}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** A labelled slider with its current value on the right */
export function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  hint,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <output htmlFor={id} className="text-sm font-semibold tabular-nums">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-6 w-full cursor-pointer accent-primary"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** A problem, shown inside a tool */
export function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warning" | "error" }) {
  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm",
        tone === "error" ? "bg-destructive/10 text-destructive" : tone === "warning" ? "bg-warning/15 text-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      <TriangleAlert className={cn("mt-0.5 size-4 shrink-0", tone === "warning" && "text-warning")} aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

export const durationText = (seconds: number | null) => (seconds === null ? "Reading..." : formatTime(seconds, false))

/** "video" for movie files, "audio" for the rest */
export const kindOfFile = (file: File): "video" | "audio" =>
  file.type.startsWith("video/") || /\.(mp4|mov|mkv|webm|avi|m4v|3gp|hevc)$/i.test(file.name) ? "video" : "audio"
