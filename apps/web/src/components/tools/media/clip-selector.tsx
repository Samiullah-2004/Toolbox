"use client"

import { useRef, useState } from "react"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MediaPreview, Notice } from "@/components/tools/media/media-parts"
import { RangeSelector, TimeField } from "@/components/tools/media/range-selector"
import { formatTime } from "@/lib/media/commands"

/**
 * Pick a part of a video or sound: the player, a timeline with two handles, and two boxes
 * for typing exact times. Moving a handle jumps the player there, so you see what you choose.
 */
export function ClipSelector({
  file,
  kind,
  duration,
  onDuration,
  start,
  end,
  onRange,
  maxLength,
  label,
  background,
  hint,
}: {
  file: File
  kind: "video" | "audio"
  /** null until the length is known */
  duration: number | null
  onDuration: (seconds: number) => void
  start: number
  end: number
  onRange: (start: number, end: number) => void
  maxLength?: number
  label: string
  /** drawn inside the timeline, like a sound wave */
  background?: React.ReactNode
  hint?: string
}) {
  const media = useRef<HTMLMediaElement | null>(null)
  const stopAt = useRef<number | null>(null)
  const [time, setTime] = useState(0)

  const seek = (seconds: number) => {
    if (media.current) media.current.currentTime = seconds
    setTime(seconds)
  }

  const playSelection = () => {
    stopAt.current = end
    seek(start)
    void media.current?.play()
  }

  return (
    <div className="space-y-3">
      <MediaPreview
        file={file}
        kind={kind}
        mediaRef={media}
        onDuration={onDuration}
        onTime={(seconds) => {
          setTime(seconds)
          if (stopAt.current !== null && seconds >= stopAt.current) {
            media.current?.pause()
            stopAt.current = null
          }
        }}
      />

      {duration === null ? (
        <div className="h-20 animate-pulse rounded-xl bg-muted" aria-busy="true" aria-label="Reading the length" />
      ) : (
        <>
          <RangeSelector
            label={label}
            duration={duration}
            start={start}
            end={end}
            maxLength={maxLength}
            playhead={time}
            onChange={(nextStart, nextEnd, moved) => {
              onRange(nextStart, nextEnd)
              seek(moved === "start" ? nextStart : nextEnd)
            }}
            onSeek={seek}
          >
            {background}
          </RangeSelector>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <TimeField id="clip-start" label="From" value={start} min={0} max={end - 0.2} onCommit={(seconds) => onRange(seconds, end)} />
            <TimeField
              id="clip-end"
              label="To"
              value={end}
              min={start + 0.2}
              max={maxLength ? Math.min(duration, start + maxLength) : duration}
              onCommit={(seconds) => onRange(start, seconds)}
            />
            <Button variant="outline" size="lg" onClick={playSelection} className="col-span-2 sm:col-span-1">
              <Play />
              Play this part
            </Button>
          </div>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {formatTime(end - start)} chosen of {formatTime(duration, false)}.{" "}
            {hint ?? "Drag the orange handles, or click one and use the arrow keys."}
          </p>
          {maxLength && end - start >= maxLength - 0.05 && <Notice>The longest part allowed here is {maxLength} seconds.</Notice>}
        </>
      )}
    </div>
  )
}
