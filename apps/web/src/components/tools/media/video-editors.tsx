"use client"

// The six video tools. Each is an "editor": it shows the file and its choices, then hands the
// shell a plan to run (see media-shell.tsx).

import { useRef, useState } from "react"
import { ClipSelector } from "@/components/tools/media/clip-selector"
import { ChoiceCards, durationText, FileCard, MediaPreview, Notice } from "@/components/tools/media/media-parts"
import { MediaWorkspace, type EditorProps } from "@/components/tools/media/media-shell"
import { ActionButton, WorkspaceFooter } from "@/components/tools/workspace-parts"
import { outputName } from "@/lib/download"
import { formatBytes } from "@/lib/format"
import {
  compressSettings,
  compressVideoArgs,
  convertVideoArgs,
  formatTime,
  frameAtArgs,
  framesEveryArgs,
  muteVideoArgs,
  trimVideoArgs,
  videoFormats,
  videoToGifArgs,
  type ImageFormat,
  type VideoFormat,
} from "@/lib/media/commands"
import type { Tool } from "@/lib/tools"

const mimeOf: Record<VideoFormat, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
}

const baseName = (name: string) => name.replace(/\.[^.]+$/, "")
const MB = 1024 * 1024

function Shell({ tool, children, action }: { tool: Tool; children: React.ReactNode; action: React.ReactNode }) {
  return (
    <>
      <div className="space-y-4 p-4 sm:p-6">{children}</div>
      <WorkspaceFooter tool={tool}>{action}</WorkspaceFooter>
    </>
  )
}

const SlowNote = (
  <Notice>The work happens on your device, so a long video can take a few minutes. Keep this tab open while it runs.</Notice>
)

/* ---------- Video Converter ---------- */

function ConvertEditor({ tool, files, chooseFiles, onRun }: EditorProps) {
  const file = files[0]
  const [duration, setDuration] = useState<number | null>(null)
  const [format, setFormat] = useState<VideoFormat>("mp4")
  const already = file.name.toLowerCase().endsWith(`.${format}`)

  return (
    <Shell
      tool={tool}
      action={
        <ActionButton
          ready
          onClick={() =>
            onRun({
              inputs: [file],
              working: `Converting to ${format.toUpperCase()}`,
              args: (inputs, out) => convertVideoArgs(inputs[0], `${out}/video.${format}`, format),
              fileName: outputName(file.name, "converted", format),
              type: mimeOf[format],
              summary: ([output]) => `Saved as ${format.toUpperCase()}, ${formatBytes(output.bytes.length)}.`,
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
        name="convert-format"
        label="Convert to"
        value={format}
        onChange={setFormat}
        className="grid-cols-2 sm:grid-cols-5"
        choices={videoFormats.map((f) => ({ value: f.id, title: f.label, text: f.note }))}
      />
      {already && <Notice tone="warning">This video is already a {format.toUpperCase()} file. Converting it again makes a fresh copy.</Notice>}
      {SlowNote}
    </Shell>
  )
}

/* ---------- Compress Video ---------- */

const sizePresets = [
  { value: 8, title: "8 MB", text: "Small, for slow data" },
  { value: 16, title: "16 MB", text: "WhatsApp limit" },
  { value: 25, title: "25 MB", text: "Email attachment" },
  { value: 50, title: "50 MB", text: "Good quality" },
]

function CompressEditor({ tool, files, chooseFiles, onRun }: EditorProps) {
  const file = files[0]
  const [duration, setDuration] = useState<number | null>(null)
  // start at 16 MB (WhatsApp), or half the file when it is smaller than that
  const [targetMB, setTargetMB] = useState(() => Math.max(1, Math.min(16, Math.floor(file.size / MB / 2))))

  const target = targetMB * MB
  const alreadySmaller = target >= file.size * 0.95
  const settings = duration !== null ? compressSettings(target, duration) : null
  const ready = duration !== null && targetMB >= 1 && !alreadySmaller

  return (
    <Shell
      tool={tool}
      action={
        <ActionButton
          ready={ready}
          onClick={() =>
            onRun({
              inputs: [file],
              working: `Shrinking to about ${targetMB} MB`,
              args: (inputs, out) => compressVideoArgs(inputs[0], `${out}/video.mp4`, target, duration!),
              fileName: outputName(file.name, `under ${targetMB} MB`, "mp4"),
              type: "video/mp4",
              summary: ([output]) => `${formatBytes(file.size)} became ${formatBytes(output.bytes.length)} (you asked for about ${targetMB} MB).`,
            })
          }
        >
          {tool.actionLabel}
        </ActionButton>
      }
    >
      <FileCard file={file} kind="video" detail={durationText(duration)} onReplace={chooseFiles} />
      <MediaPreview file={file} kind="video" onDuration={setDuration} />
      <ChoiceCards name="compress-size" label="Target size" value={targetMB} onChange={setTargetMB} className="grid-cols-2 sm:grid-cols-4" choices={sizePresets} />
      <div className="max-w-xs">
        <label htmlFor="target-mb" className="text-sm font-medium">
          Or type your own size, in MB
        </label>
        <input
          id="target-mb"
          type="number"
          min={1}
          max={Math.max(1, Math.floor(file.size / MB))}
          inputMode="numeric"
          value={targetMB || ""}
          onChange={(event) => setTargetMB(Math.floor(Number(event.target.value)))}
          className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-base outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15 sm:text-sm"
        />
      </div>
      {alreadySmaller ? (
        <Notice tone="warning">
          This video is {formatBytes(file.size)} already. Choose a size that is clearly smaller than that.
        </Notice>
      ) : settings?.veryTight ? (
        <Notice tone="warning">
          {targetMB} MB is very small for {formatTime(duration!, false)} of video. It will work, but the picture will look rough. Try a
          bigger size for better quality.
        </Notice>
      ) : settings ? (
        <Notice>The picture will be up to {settings.height}p so it fits well in {targetMB} MB. The final size is close to this, not exact.</Notice>
      ) : null}
      {SlowNote}
    </Shell>
  )
}

/* ---------- Trim Video ---------- */

function TrimVideoEditor({ tool, files, chooseFiles, onRun }: EditorProps) {
  const file = files[0]
  const [duration, setDuration] = useState<number | null>(null)
  const [range, setRange] = useState<{ start: number; end: number } | null>(null)
  const [exact, setExact] = useState(true)
  const start = range?.start ?? 0
  const end = range?.end ?? duration ?? 0
  const extension = /\.([a-z0-9]+)$/i.exec(file.name)?.[1].toLowerCase() ?? "mp4"
  const outputExtension = exact ? "mp4" : extension

  return (
    <Shell
      tool={tool}
      action={
        <ActionButton
          ready={duration !== null && end - start >= 0.2}
          onClick={() =>
            onRun({
              inputs: [file],
              working: "Cutting your video",
              args: (inputs, out) => trimVideoArgs(inputs[0], `${out}/video.${outputExtension}`, start, end, exact),
              fileName: outputName(file.name, `${formatTime(start, false).replace(":", "m")}s to ${formatTime(end, false).replace(":", "m")}s`, outputExtension),
              type: exact ? "video/mp4" : file.type || "video/mp4",
              summary: ([output]) => `Kept ${formatTime(end - start)} of your video, ${formatBytes(output.bytes.length)}.`,
            })
          }
        >
          {tool.actionLabel}
        </ActionButton>
      }
    >
      <FileCard file={file} kind="video" detail={durationText(duration)} onReplace={chooseFiles} />
      <ClipSelector
        file={file}
        kind="video"
        label="Part to keep"
        duration={duration}
        onDuration={setDuration}
        start={start}
        end={end}
        onRange={(nextStart, nextEnd) => setRange({ start: nextStart, end: nextEnd })}
      />
      <ChoiceCards
        name="trim-mode"
        label="How to cut"
        value={exact ? "exact" : "fast"}
        onChange={(value) => setExact(value === "exact")}
        className="sm:grid-cols-2"
        choices={[
          { value: "exact", title: "Exact cut", text: "Starts exactly where you chose. Takes longer." },
          { value: "fast", title: "Fast cut", text: "Instant, but may start up to a second early." },
        ]}
      />
    </Shell>
  )
}

/* ---------- Video to GIF ---------- */

const gifSizes = [
  { value: 320, title: "Small", text: "320 px wide" },
  { value: 480, title: "Medium", text: "480 px wide" },
  { value: 640, title: "Large", text: "640 px wide" },
]

function GifEditor({ tool, files, chooseFiles, onRun }: EditorProps) {
  const file = files[0]
  const [duration, setDuration] = useState<number | null>(null)
  const [range, setRange] = useState<{ start: number; end: number } | null>(null)
  const [width, setWidth] = useState(480)
  const [fps, setFps] = useState(12)
  const start = range?.start ?? 0
  const end = range?.end ?? Math.min(duration ?? 0, 5)

  return (
    <Shell
      tool={tool}
      action={
        <ActionButton
          ready={duration !== null && end - start >= 0.2}
          onClick={() =>
            onRun({
              inputs: [file],
              working: "Making your GIF",
              args: (inputs, out) => videoToGifArgs(inputs[0], `${out}/clip.gif`, start, end, width, fps),
              fileName: outputName(file.name, "GIF", "gif"),
              type: "image/gif",
              summary: ([output]) => `A ${formatTime(end - start)} GIF, ${formatBytes(output.bytes.length)}.`,
            })
          }
        >
          {tool.actionLabel}
        </ActionButton>
      }
    >
      <FileCard file={file} kind="video" detail={durationText(duration)} onReplace={chooseFiles} />
      <ClipSelector
        file={file}
        kind="video"
        label="Part for the GIF"
        duration={duration}
        onDuration={setDuration}
        start={start}
        end={end}
        maxLength={15}
        onRange={(nextStart, nextEnd) => setRange({ start: nextStart, end: nextEnd })}
      />
      <ChoiceCards name="gif-size" label="GIF size" value={width} onChange={setWidth} className="grid-cols-3" choices={gifSizes} />
      <ChoiceCards
        name="gif-speed"
        label="Smoothness"
        value={fps}
        onChange={setFps}
        className="sm:grid-cols-2"
        choices={[
          { value: 12, title: "Normal", text: "12 pictures a second. Smaller file." },
          { value: 20, title: "Smooth", text: "20 pictures a second. Bigger file." },
        ]}
      />
    </Shell>
  )
}

/* ---------- Extract Frames ---------- */

const gaps = [1, 2, 5, 10, 30]
const MOST_FRAMES = 200

function FramesEditor({ tool, files, chooseFiles, onRun }: EditorProps) {
  const file = files[0]
  const media = useRef<HTMLMediaElement | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [mode, setMode] = useState<"moment" | "every">("moment")
  const [every, setEvery] = useState(5)
  const [format, setFormat] = useState<ImageFormat>("jpg")
  const base = baseName(file.name)
  const count = duration === null ? 0 : Math.ceil(duration / every)
  const tooMany = mode === "every" && count > MOST_FRAMES

  const run = () => {
    if (mode === "moment") {
      // the moment the player is paused on
      const at = Math.min(media.current?.currentTime ?? 0, Math.max(0, (duration ?? 0) - 0.1))
      onRun({
        inputs: [file],
        working: "Grabbing your picture",
        args: (inputs, out) => frameAtArgs(inputs[0], `${out}/frame.${format}`, at, format),
        fileName: outputName(file.name, `at ${Math.floor(at)}s`, format),
        type: format === "jpg" ? "image/jpeg" : "image/png",
        summary: ([output]) => `The picture at ${formatTime(at)}, ${formatBytes(output.bytes.length)}.`,
      })
    } else {
      onRun({
        inputs: [file],
        working: "Saving your pictures",
        args: (inputs, out) => framesEveryArgs(inputs[0], out, every, format),
        fileName: outputName(file.name, "frames", "zip"),
        type: "application/zip",
        summary: (outputs) => `${outputs.length} pictures, one every ${every} ${every === 1 ? "second" : "seconds"}, packed in one ZIP file.`,
        zipEntryName: (_, i) => `${base} - frame ${i + 1}.${format}`,
      })
    }
  }

  return (
    <Shell
      tool={tool}
      action={
        <ActionButton ready={duration !== null && !tooMany} onClick={run}>
          {mode === "moment" ? "Save this picture" : tool.actionLabel}
        </ActionButton>
      }
    >
      <FileCard file={file} kind="video" detail={durationText(duration)} onReplace={chooseFiles} />
      <MediaPreview file={file} kind="video" mediaRef={media} onDuration={setDuration} />
      <ChoiceCards
        name="frames-mode"
        label="What to save"
        value={mode}
        onChange={setMode}
        className="sm:grid-cols-2"
        choices={[
          { value: "moment", title: "One moment", text: "Pause the video where you want, then save" },
          { value: "every", title: "Many pictures", text: "One every few seconds, in a ZIP" },
        ]}
      />
      {mode === "every" && (
        <>
          <ChoiceCards
            name="frames-gap"
            label="A picture every"
            value={every}
            onChange={setEvery}
            className="grid-cols-3 sm:grid-cols-5"
            choices={gaps.map((gap) => ({ value: gap, title: `${gap} ${gap === 1 ? "second" : "seconds"}` }))}
          />
          {duration !== null &&
            (tooMany ? (
              <Notice tone="warning">That would be {count} pictures. Choose a longer gap, so it stays under {MOST_FRAMES}.</Notice>
            ) : (
              <Notice>You will get about {count} {count === 1 ? "picture" : "pictures"}.</Notice>
            ))}
        </>
      )}
      <ChoiceCards
        name="frames-format"
        label="Picture type"
        value={format}
        onChange={setFormat}
        className="sm:grid-cols-2"
        choices={[
          { value: "jpg", title: "JPG", text: "Small files" },
          { value: "png", title: "PNG", text: "Sharper, bigger files" },
        ]}
      />
    </Shell>
  )
}

/* ---------- Remove Audio ---------- */

function MuteEditor({ tool, files, chooseFiles, onRun }: EditorProps) {
  const file = files[0]
  const [duration, setDuration] = useState<number | null>(null)
  // the picture is copied as it is, so the new file keeps the same kind of container
  const extension = /\.(mp4|mov|mkv|webm|avi)$/i.exec(file.name)?.[1].toLowerCase() ?? "mp4"

  return (
    <Shell
      tool={tool}
      action={
        <ActionButton
          ready
          onClick={() =>
            onRun({
              inputs: [file],
              working: "Taking out the sound",
              args: (inputs, out) => muteVideoArgs(inputs[0], `${out}/video.${extension}`),
              fileName: outputName(file.name, "no sound", extension),
              type: file.type || "video/mp4",
              summary: ([output]) => `The same video without sound, ${formatBytes(output.bytes.length)}.`,
            })
          }
        >
          {tool.actionLabel}
        </ActionButton>
      }
    >
      <FileCard file={file} kind="video" detail={durationText(duration)} onReplace={chooseFiles} />
      <MediaPreview file={file} kind="video" onDuration={setDuration} />
      <Notice>The picture is copied exactly as it is, so this is quick and loses no quality.</Notice>
    </Shell>
  )
}

/* ---------- Exports, one per tool page ---------- */

export const ConvertVideoWorkspace = ({ tool }: { tool: Tool }) => (
  <MediaWorkspace tool={tool} Editor={ConvertEditor} next={["compress-video", "trim-video", "video-to-mp3", "video-to-gif"]} />
)
export const CompressVideoWorkspace = ({ tool }: { tool: Tool }) => (
  <MediaWorkspace tool={tool} Editor={CompressEditor} next={["trim-video", "convert-video", "video-to-mp3", "mute-video"]} />
)
export const TrimVideoWorkspace = ({ tool }: { tool: Tool }) => (
  <MediaWorkspace tool={tool} Editor={TrimVideoEditor} next={["compress-video", "video-to-gif", "video-to-mp3", "convert-video"]} />
)
export const VideoToGifWorkspace = ({ tool }: { tool: Tool }) => <MediaWorkspace tool={tool} Editor={GifEditor} />
export const ExtractFramesWorkspace = ({ tool }: { tool: Tool }) => <MediaWorkspace tool={tool} Editor={FramesEditor} />
export const MuteVideoWorkspace = ({ tool }: { tool: Tool }) => (
  <MediaWorkspace tool={tool} Editor={MuteEditor} next={["compress-video", "trim-video", "convert-video"]} />
)
