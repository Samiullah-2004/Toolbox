"use client"

// The five audio tools. Each is an "editor": it shows the file and its choices, then hands the
// shell a plan to run (see media-shell.tsx).

import { useEffect, useRef, useState } from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDown, ArrowUp, GripVertical, Music, Plus, RotateCcw, X } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { ClipSelector } from "@/components/tools/media/clip-selector"
import {
  ChoiceCards,
  durationText,
  FileCard,
  kindOfFile,
  MediaPreview,
  Notice,
  SliderField,
} from "@/components/tools/media/media-parts"
import { MediaWorkspace, type EditorProps } from "@/components/tools/media/media-shell"
import { ActionButton, fileKey, WorkspaceFooter } from "@/components/tools/workspace-parts"
import { outputName } from "@/lib/download"
import { formatBytes } from "@/lib/format"
import {
  audioEffectsArgs,
  audioFormats,
  cutAudioArgs,
  defaultAudioFormat,
  formatTime,
  hasEffects,
  keepAudioArgs,
  mergeAudioArgs,
  noEffects,
  videoToMp3Args,
  voiceNoteArgs,
  type AudioEffects,
  type AudioFormat,
} from "@/lib/media/commands"
import { readWaveform, type Waveform } from "@/lib/media/waveform"
import type { Tool } from "@/lib/tools"

const mimeOf: Record<AudioFormat, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg",
}

function Shell({ tool, children, action }: { tool: Tool; children: React.ReactNode; action: React.ReactNode }) {
  return (
    <>
      <div className="space-y-4 p-4 sm:p-6">{children}</div>
      <WorkspaceFooter tool={tool}>{action}</WorkspaceFooter>
    </>
  )
}

function FormatPicker({ value, onChange, name }: { value: AudioFormat; onChange: (value: AudioFormat) => void; name: string }) {
  return (
    <ChoiceCards
      name={name}
      label="Save as"
      value={value}
      onChange={onChange}
      className="grid-cols-2 sm:grid-cols-4"
      choices={audioFormats.map((f) => ({ value: f.id, title: f.label, text: f.note }))}
    />
  )
}

/* ---------- Video to MP3 ---------- */

const qualities = [
  { value: 64, title: "64 kbps", note: "Smallest, fine for talking" },
  { value: 128, title: "128 kbps", note: "Good for most things" },
  { value: 192, title: "192 kbps", note: "Clear music" },
  { value: 320, title: "320 kbps", note: "Best quality" },
]

function VideoToMp3Editor({ tool, files, chooseFiles, onRun }: EditorProps) {
  const file = files[0]
  const [duration, setDuration] = useState<number | null>(null)
  const [kbps, setKbps] = useState(128)

  return (
    <Shell
      tool={tool}
      action={
        <ActionButton
          ready
          onClick={() =>
            onRun({
              inputs: [file],
              working: "Taking the sound out",
              args: (inputs, out) => videoToMp3Args(inputs[0], `${out}/audio.mp3`, kbps),
              fileName: outputName(file.name, "audio", "mp3"),
              type: "audio/mpeg",
              summary: ([output]) => `Saved as MP3 at ${kbps} kbps, ${formatBytes(output.bytes.length)}.`,
            })
          }
        >
          {tool.actionLabel}
        </ActionButton>
      }
    >
      <FileCard file={file} kind="video" detail={durationText(duration)} onReplace={chooseFiles} />
      <MediaPreview file={file} kind="video" onDuration={setDuration} />
      <ChoiceCards
        name="mp3-quality"
        label="Quality"
        value={kbps}
        onChange={setKbps}
        className="grid-cols-2 sm:grid-cols-4"
        choices={qualities.map((q) => ({
          value: q.value,
          title: q.title,
          text: duration === null ? q.note : `${q.note}. About ${formatBytes((q.value * 125 * duration) | 0)}.`,
        }))}
      />
    </Shell>
  )
}

/* ---------- Trim & Cut Audio ---------- */

/** The sound drawn as a wave, filling its box */
function WaveformPicture({ peaks }: { peaks: Float32Array }) {
  const path = Array.from(peaks, (peak, i) => {
    const half = Math.max(peak * 46, 1)
    return `M${i + 0.5} ${50 - half}V${50 + half}`
  }).join("")
  return (
    <svg viewBox={`0 0 ${peaks.length} 100`} preserveAspectRatio="none" className="size-full text-primary/70" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="0.7" fill="none" />
    </svg>
  )
}

function TrimAudioEditor({ tool, files, chooseFiles, onRun }: EditorProps) {
  const file = files[0]
  const [duration, setDuration] = useState<number | null>(null)
  const [wave, setWave] = useState<Waveform | "failed" | null>(null)
  const [range, setRange] = useState<{ start: number; end: number } | null>(null)
  const [mode, setMode] = useState<"keep" | "cut">("keep")
  const [format, setFormat] = useState<AudioFormat>(() => defaultAudioFormat(file.name))

  useEffect(() => {
    let current = true
    readWaveform(file)
      .then((result) => {
        if (!current) return
        setWave(result)
        setDuration(result.duration)
      })
      .catch(() => current && setWave("failed"))
    return () => {
      current = false
    }
  }, [file])

  const start = range?.start ?? 0
  const end = range?.end ?? duration ?? 0
  const wholeFile = duration !== null && end - start >= duration - 0.1
  const ready = duration !== null && end - start >= 0.2 && !(mode === "cut" && wholeFile)

  return (
    <Shell
      tool={tool}
      action={
        <ActionButton
          ready={ready}
          onClick={() =>
            onRun({
              inputs: [file],
              working: mode === "keep" ? "Cutting your audio" : "Removing that part",
              args: (inputs, out) =>
                (mode === "keep" ? keepAudioArgs : cutAudioArgs)(inputs[0], `${out}/audio.${format}`, start, end, format),
              fileName: outputName(file.name, mode === "keep" ? "trimmed" : "cut", format),
              type: mimeOf[format],
              summary: ([output]) =>
                mode === "keep"
                  ? `Kept ${formatTime(end - start)} of your audio, ${formatBytes(output.bytes.length)}.`
                  : `Removed ${formatTime(end - start)}, ${formatBytes(output.bytes.length)} left.`,
            })
          }
        >
          {tool.actionLabel}
        </ActionButton>
      }
    >
      <FileCard file={file} kind="audio" detail={durationText(duration)} onReplace={chooseFiles} />
      <ClipSelector
        file={file}
        kind="audio"
        label={mode === "keep" ? "Part to keep" : "Part to remove"}
        duration={duration}
        onDuration={setDuration}
        start={start}
        end={end}
        onRange={(nextStart, nextEnd) => setRange({ start: nextStart, end: nextEnd })}
        background={wave && wave !== "failed" ? <WaveformPicture peaks={wave.peaks} /> : undefined}
        hint="Drag the orange handles over the wave, or click one and use the arrow keys."
      />
      {wave === null && <p className="text-xs text-muted-foreground">Drawing the sound wave...</p>}
      {wave === "failed" && <Notice>The sound wave can&apos;t be drawn for this file, but you can still choose the part with the handles.</Notice>}
      <ChoiceCards
        name="trim-audio-mode"
        label="What to do with the chosen part"
        value={mode}
        onChange={setMode}
        className="sm:grid-cols-2"
        choices={[
          { value: "keep", title: "Keep this part", text: "Save only the chosen part" },
          { value: "cut", title: "Cut this part out", text: "Remove it and join the rest" },
        ]}
      />
      {mode === "cut" && wholeFile && <Notice tone="warning">That would remove everything. Choose just the part you don&apos;t want.</Notice>}
      <FormatPicker name="trim-audio-format" value={format} onChange={setFormat} />
    </Shell>
  )
}

/* ---------- Merge Audio ---------- */

/** How long a clip is, as far as the browser can tell */
function useClipLength(file: File) {
  const [seconds, setSeconds] = useState<number | null>(null)
  useEffect(() => {
    const audio = new Audio()
    const url = URL.createObjectURL(file)
    audio.preload = "metadata"
    audio.onloadedmetadata = () => setSeconds(Number.isFinite(audio.duration) ? audio.duration : null)
    audio.src = url
    return () => {
      audio.onloadedmetadata = null
      URL.revokeObjectURL(url)
    }
  }, [file])
  return seconds
}

function AudioRow({
  file,
  index,
  count,
  onMove,
  onRemove,
}: {
  file: File
  index: number
  count: number
  onMove: (from: number, to: number) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: fileKey(file) })
  const length = useClipLength(file)

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative flex items-center gap-2 rounded-2xl border bg-background p-2 transition-shadow sm:gap-3",
        isDragging && "z-10 scale-[1.02] shadow-xl ring-2 ring-primary/40"
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Drag to reorder ${file.name}`}
        className="flex h-12 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground tabular-nums">
        {index + 1}
      </span>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Music className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {length === null ? "" : `${formatTime(length, false)} · `}
          {formatBytes(file.size)}
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        <Button variant="ghost" size="icon-sm" aria-label={`Move ${file.name} up`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
          <ArrowUp />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={`Move ${file.name} down`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>
          <ArrowDown />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${file.name}`} onClick={onRemove}>
          <X />
        </Button>
      </div>
    </li>
  )
}

function MergeAudioEditor({ tool, files, setFiles, chooseFiles, onRun }: EditorProps) {
  const [format, setFormat] = useState<AudioFormat>(() => defaultAudioFormat(files[0].name))
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // a short press on touch screens, so scrolling the page still works
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const move = (from: number, to: number) => setFiles((current) => arrayMove(current, from, to))
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    move(
      files.findIndex((f) => fileKey(f) === active.id),
      files.findIndex((f) => fileKey(f) === over.id)
    )
  }

  return (
    <Shell
      tool={tool}
      action={
        <>
          <Button variant="ghost" size="lg" onClick={() => setFiles([])}>
            Clear
          </Button>
          <ActionButton
            ready={files.length >= 2}
            onClick={() =>
              onRun({
                inputs: files,
                working: `Joining ${files.length} clips`,
                args: (inputs, out) => mergeAudioArgs(inputs, `${out}/audio.${format}`, format),
                fileName: outputName(files[0].name, "merged", format),
                type: mimeOf[format],
                summary: ([output]) => `${files.length} clips joined into one ${format.toUpperCase()} file, ${formatBytes(output.bytes.length)}.`,
              })
            }
          >
            {tool.actionLabel}
          </ActionButton>
        </>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">
            {files.length} {files.length === 1 ? "clip" : "clips"}
          </p>
          <p className="text-xs text-muted-foreground">
            Drag <GripVertical className="inline size-3.5 align-text-bottom" aria-hidden="true" /> or use the arrows to set the order.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={chooseFiles}>
          <Plus />
          Add more
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={files.map(fileKey)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {files.map((file, i) => (
              <AudioRow
                key={fileKey(file)}
                file={file}
                index={i}
                count={files.length}
                onMove={move}
                onRemove={() => setFiles((current) => current.filter((_, at) => at !== i))}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {files.length === 1 && <Notice>Add at least one more clip to merge.</Notice>}
      <FormatPicker name="merge-audio-format" value={format} onChange={setFormat} />
    </Shell>
  )
}

/* ---------- WhatsApp Voice Note ---------- */

function VoiceNoteEditor({ tool, files, chooseFiles, onRun }: EditorProps) {
  const file = files[0]
  const kind = kindOfFile(file)
  const [duration, setDuration] = useState<number | null>(null)

  return (
    <Shell
      tool={tool}
      action={
        <ActionButton
          ready
          onClick={() =>
            onRun({
              inputs: [file],
              working: "Making your voice note",
              args: (inputs, out) => voiceNoteArgs(inputs[0], `${out}/voice.ogg`),
              fileName: outputName(file.name, "voice note", "ogg"),
              type: "audio/ogg",
              summary: ([output]) => `A voice note in OGG Opus, ${formatBytes(output.bytes.length)}.`,
            })
          }
        >
          {tool.actionLabel}
        </ActionButton>
      }
    >
      <FileCard file={file} kind={kind} detail={durationText(duration)} onReplace={chooseFiles} />
      <MediaPreview file={file} kind={kind} onDuration={setDuration} />
      <Notice>
        We save one voice channel as OGG Opus at 32 kbps. That is small, and made for speaking. Music will sound thinner than the
        original.
      </Notice>
    </Shell>
  )
}

/* ---------- Volume, Speed & Fade ---------- */

/**
 * Lets the person hear volume and speed while they move the sliders. A normal player can't go
 * above 100% volume, so the sound is routed through a volume control once they press play.
 */
function useLivePreview(volume: number) {
  const context = useRef<AudioContext | null>(null)
  const gain = useRef<GainNode | null>(null)

  useEffect(() => {
    if (gain.current) gain.current.gain.value = volume
  }, [volume])

  useEffect(
    () => () => {
      void context.current?.close()
    },
    []
  )

  return (element: HTMLMediaElement) => {
    if (!context.current) {
      const audioContext = new AudioContext()
      const node = audioContext.createGain()
      node.gain.value = volume
      audioContext.createMediaElementSource(element).connect(node).connect(audioContext.destination)
      context.current = audioContext
      gain.current = node
    }
    void context.current.resume()
  }
}

function EffectsEditor({ tool, files, chooseFiles, onRun }: EditorProps) {
  const file = files[0]
  const media = useRef<HTMLMediaElement | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [effects, setEffects] = useState<AudioEffects>(noEffects)
  const [format, setFormat] = useState<AudioFormat>(() => defaultAudioFormat(file.name))
  const set = (change: Partial<AudioEffects>) => setEffects((current) => ({ ...current, ...change }))
  const attach = useLivePreview(effects.volume)

  useEffect(() => {
    const element = media.current
    if (!element) return
    element.defaultPlaybackRate = effects.speed
    element.playbackRate = effects.speed
    element.preservesPitch = true
  }, [effects.speed])
  const fadeMax = Math.min(10, Math.floor(((duration ?? 20) / effects.speed / 2) * 2) / 2)

  return (
    <Shell
      tool={tool}
      action={
        <>
          <Button variant="ghost" size="lg" onClick={() => setEffects(noEffects)} disabled={!hasEffects(effects)}>
            <RotateCcw />
            Reset
          </Button>
          <ActionButton
            ready={duration !== null && hasEffects(effects)}
            onClick={() =>
              onRun({
                inputs: [file],
                working: "Applying your changes",
                args: (inputs, out) => audioEffectsArgs(inputs[0], `${out}/audio.${format}`, effects, duration!, format),
                fileName: outputName(file.name, "edited", format),
                type: mimeOf[format],
                summary: ([output]) => `Saved as ${format.toUpperCase()}, ${formatBytes(output.bytes.length)}.`,
              })
            }
          >
            {tool.actionLabel}
          </ActionButton>
        </>
      }
    >
      <FileCard file={file} kind="audio" detail={durationText(duration)} onReplace={chooseFiles} />
      <MediaPreview file={file} kind="audio" mediaRef={media} onDuration={setDuration} onPlay={() => media.current && attach(media.current)} />
      <p className="text-xs text-muted-foreground">Press play and move the sliders to hear volume and speed. Fades are added when you save.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <SliderField
          id="effect-volume"
          label="Volume"
          value={effects.volume}
          min={0}
          max={3}
          step={0.05}
          display={`${Math.round(effects.volume * 100)}%`}
          onChange={(volume) => set({ volume })}
          hint={effects.volume > 1.5 ? "Very loud sound can crackle." : undefined}
        />
        <SliderField
          id="effect-speed"
          label="Speed"
          value={effects.speed}
          min={0.5}
          max={2}
          step={0.05}
          display={`${effects.speed.toFixed(2)}×`}
          onChange={(speed) => set({ speed })}
          hint="The voice keeps its normal pitch."
        />
        <SliderField
          id="effect-fade-in"
          label="Fade in"
          value={effects.fadeIn}
          min={0}
          max={Math.max(fadeMax, 0.5)}
          step={0.5}
          display={effects.fadeIn === 0 ? "Off" : `${effects.fadeIn} s`}
          onChange={(fadeIn) => set({ fadeIn })}
        />
        <SliderField
          id="effect-fade-out"
          label="Fade out"
          value={effects.fadeOut}
          min={0}
          max={Math.max(fadeMax, 0.5)}
          step={0.5}
          display={effects.fadeOut === 0 ? "Off" : `${effects.fadeOut} s`}
          onChange={(fadeOut) => set({ fadeOut })}
        />
      </div>
      <FormatPicker name="effects-format" value={format} onChange={setFormat} />
    </Shell>
  )
}

/* ---------- Exports, one per tool page ---------- */

export const VideoToMp3Workspace = ({ tool }: { tool: Tool }) => (
  <MediaWorkspace tool={tool} Editor={VideoToMp3Editor} next={["trim-audio", "audio-effects", "whatsapp-voice-note", "merge-audio"]} />
)
export const TrimAudioWorkspace = ({ tool }: { tool: Tool }) => (
  <MediaWorkspace tool={tool} Editor={TrimAudioEditor} next={["audio-effects", "whatsapp-voice-note", "merge-audio"]} />
)
export const MergeAudioWorkspace = ({ tool }: { tool: Tool }) => (
  <MediaWorkspace tool={tool} Editor={MergeAudioEditor} next={["trim-audio", "audio-effects", "whatsapp-voice-note"]} />
)
export const VoiceNoteWorkspace = ({ tool }: { tool: Tool }) => (
  <MediaWorkspace tool={tool} Editor={VoiceNoteEditor} next={["trim-audio", "audio-effects"]} />
)
export const AudioEffectsWorkspace = ({ tool }: { tool: Tool }) => (
  <MediaWorkspace tool={tool} Editor={EffectsEditor} next={["trim-audio", "whatsapp-voice-note", "merge-audio"]} />
)
