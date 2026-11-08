"use client"

// The picture tools. Each is an "editor": it shows the pictures and the choices, then hands the
// shell a job to run (see editor-workspace.tsx).

import { useEffect, useRef, useState } from "react"
import { Link2, Link2Off, Plus, X } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { asJob, EditorWorkspace, type EditorProps } from "@/components/tools/editor-workspace"
import { ChoiceCards, Notice } from "@/components/tools/media/media-parts"
import { ActionButton, fileKey, WorkspaceFooter } from "@/components/tools/workspace-parts"
import { FileThumb } from "@/components/upload/file-thumb"
import { useObjectUrlRef } from "@/hooks/use-object-url-ref"
import { outputName } from "@/lib/download"
import { formatBytes } from "@/lib/format"
import { composeCutout, findSubject } from "@/lib/image/cutout"
import {
  extensionFor,
  ImageError,
  processImage,
  readImageInfo,
  runBatch,
  zipFiles,
  typeOfImage,
  type ImageInfo,
  type ImageType,
} from "@/lib/image/image"
import type { Tool } from "@/lib/tools"

function Shell({ tool, children, action }: { tool: Tool; children: React.ReactNode; action: React.ReactNode }) {
  return (
    <>
      <div className="space-y-4 p-4 sm:p-6">{children}</div>
      <WorkspaceFooter tool={tool}>{action}</WorkspaceFooter>
    </>
  )
}

/** Width and height of each picture, read once */
function useImageInfo(files: File[]) {
  const [infos, setInfos] = useState(() => new Map<File, ImageInfo | "error">())
  // pictures already being read, so each one is read only once
  const started = useRef(new WeakSet<File>())
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    for (const file of files) {
      if (started.current.has(file)) continue
      started.current.add(file)
      readImageInfo(file)
        .then((info) => mounted.current && setInfos((map) => new Map(map).set(file, info)))
        .catch(() => mounted.current && setInfos((map) => new Map(map).set(file, "error")))
    }
  }, [files])
  return (file: File) => infos.get(file) ?? null
}

/** The chosen pictures, with a way to remove one or add more */
function ImageList({
  files,
  setFiles,
  chooseFiles,
  detail,
  multiple,
}: {
  files: File[]
  setFiles: EditorProps["setFiles"]
  chooseFiles: () => void
  detail: (file: File) => string
  multiple: boolean
}) {
  const total = files.reduce((sum, file) => sum + file.size, 0)
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {files.length} {files.length === 1 ? "picture" : "pictures"}
          <span className="text-muted-foreground"> &middot; {formatBytes(total)}</span>
        </p>
        <Button variant="outline" size="sm" onClick={chooseFiles}>
          <Plus />
          {multiple ? "Add more" : "Replace"}
        </Button>
      </div>
      <ul className="max-h-80 space-y-2 overflow-y-auto">
        {files.map((file, i) => (
          <li key={fileKey(file)} className="flex items-center gap-3 rounded-2xl border bg-background p-2">
            <FileThumb file={file} className="size-12" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{detail(file)}</p>
            </div>
            {multiple && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${file.name}`}
                onClick={() => setFiles((current) => current.filter((_, at) => at !== i))}
              >
                <X />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

const base = (name: string) => name.replace(/\.[^.]+$/, "") || "picture"

/** "4 pictures, 6.2 MB became 410 KB." */
function savedText(count: number, before: number, after: number) {
  return `${count === 1 ? "Your picture" : `${count} pictures`}: ${formatBytes(before)} became ${formatBytes(after)}.`
}

/* ---------- HEIC to JPG ---------- */

function HeicEditor({ tool, files, setFiles, chooseFiles, onRun }: EditorProps) {
  const [quality, setQuality] = useState(0.92)

  const run = () =>
    onRun({
      working: files.length === 1 ? "Converting your photo" : `Converting ${files.length} photos`,
      run: async (signal, onProgress) => {
        const { heicTo } = await import("heic-to/next")
        const converted: { bytes: Uint8Array; name: string }[] = []
        const failed: string[] = []
        for (const [i, file] of files.entries()) {
          signal.throwIfAborted()
          try {
            const blob = await heicTo({ blob: file, type: "image/jpeg", quality })
            converted.push({ bytes: new Uint8Array(await blob.arrayBuffer()), name: `${base(file.name)}.jpg` })
          } catch {
            failed.push(file.name) // one bad photo shouldn't stop the others
          }
          onProgress((i + 1) / files.length)
        }
        if (converted.length === 0) {
          throw new ImageError(
            files.length === 1
              ? `"${files[0].name}" couldn't be read. It may be damaged, or not a real HEIC photo.`
              : "None of these photos could be read. They may be damaged, or not real HEIC photos."
          )
        }
        const note = failed.length ? ` ${failed.length} couldn't be read and ${failed.length === 1 ? "was" : "were"} skipped: ${failed.join(", ")}.` : ""
        if (converted.length === 1) {
          const [only] = converted
          return { bytes: only.bytes, fileName: only.name, type: "image/jpeg", summary: `Saved as JPG, ${formatBytes(only.bytes.length)}.${note}` }
        }
        return { bytes: await zipFiles(converted), fileName: "Photos (JPG).zip", type: "application/zip", summary: `${converted.length} photos saved as JPG, packed in one ZIP file.${note}` }
      },
    })

  return (
    <Shell
      tool={tool}
      action={
        <ActionButton ready={files.length > 0} onClick={run}>
          {tool.actionLabel}
        </ActionButton>
      }
    >
      <ImageList files={files} setFiles={setFiles} chooseFiles={chooseFiles} multiple detail={(file) => formatBytes(file.size)} />
      <ChoiceCards
        name="heic-quality"
        label="Quality"
        value={quality}
        onChange={setQuality}
        className="sm:grid-cols-2"
        choices={[
          { value: 0.92, title: "Best quality", text: "Looks just like the original" },
          { value: 0.75, title: "Smaller files", text: "Good for uploading to forms" },
        ]}
      />
      <Notice>Your browser can&apos;t show HEIC photos, so there is no preview yet. You will see them once they are JPG.</Notice>
    </Shell>
  )
}

/* ---------- Compress Image ---------- */

const sizeTargets = [
  { value: 20, title: "20 KB", text: "Tiny, for strict forms" },
  { value: 50, title: "50 KB", text: "Signatures and small photos" },
  { value: 100, title: "100 KB", text: "Most online forms" },
  { value: 200, title: "200 KB", text: "Clear photos" },
  { value: 500, title: "500 KB", text: "Good for sharing" },
]

function CompressEditor({ tool, files, setFiles, chooseFiles, onRun }: EditorProps) {
  const infoOf = useImageInfo(files)
  const [targetKB, setTargetKB] = useState(100)
  const [format, setFormat] = useState<ImageType>("image/jpeg")
  const alreadySmall = files.length > 0 && files.every((file) => file.size <= targetKB * 1024)
  const someSmall = files.some((file) => file.size <= targetKB * 1024)

  const run = () =>
    onRun({
      working: files.length === 1 ? `Shrinking to ${targetKB} KB` : `Shrinking ${files.length} pictures`,
      run: async (signal, onProgress) => {
        let missed = 0
        const batch = await runBatch(
          files,
          async (file, signal) => {
            // a picture that already fits is kept as it is: shrinking it again only loses quality
            if (file.size <= targetKB * 1024) {
              return { bytes: new Uint8Array(await file.arrayBuffer()), name: file.name }
            }
            const result = await processImage(file, { type: format, targetBytes: targetKB * 1024 }, signal)
            if (!result.fits) missed++
            return { bytes: result.bytes, name: `${base(file.name)}.${extensionFor[format]}` }
          },
          signal,
          onProgress
        )
        const before = files.reduce((sum, file) => sum + file.size, 0)
        const after = batch.all.reduce((sum, item) => sum + item.bytes.length, 0)
        const note = missed
          ? ` ${missed === 1 ? "One picture" : `${missed} pictures`} couldn't get under ${targetKB} KB, so ${missed === 1 ? "it is" : "they are"} as small as possible.`
          : ""
        if (batch.single) {
          return {
            bytes: batch.single.bytes,
            fileName: outputName(files[0].name, `${targetKB} KB`, batch.single.name.split(".").pop()),
            type: batch.single.name.endsWith(".png") ? "image/png" : format,
            summary: savedText(1, before, after) + note,
          }
        }
        return { bytes: batch.zip!, fileName: `Pictures (under ${targetKB} KB).zip`, type: "application/zip", summary: savedText(files.length, before, after) + note }
      },
    })

  return (
    <Shell
      tool={tool}
      action={
        <ActionButton ready={files.length > 0 && targetKB >= 5 && !alreadySmall} onClick={run}>
          {tool.actionLabel}
        </ActionButton>
      }
    >
      <ImageList
        files={files}
        setFiles={setFiles}
        chooseFiles={chooseFiles}
        multiple
        detail={(file) => {
          const info = infoOf(file)
          const size = info && info !== "error" ? ` · ${info.width} × ${info.height}` : ""
          return `${formatBytes(file.size)}${size}${file.size <= targetKB * 1024 ? " · already small enough" : ""}`
        }}
      />
      <ChoiceCards name="compress-target" label="Make each picture smaller than" value={targetKB} onChange={setTargetKB} className="grid-cols-2 sm:grid-cols-5" choices={sizeTargets} />
      <div className="max-w-xs">
        <label htmlFor="target-kb" className="text-sm font-medium">
          Or type your own limit, in KB
        </label>
        <input
          id="target-kb"
          type="number"
          min={5}
          inputMode="numeric"
          value={targetKB || ""}
          onChange={(event) => setTargetKB(Math.floor(Number(event.target.value)))}
          className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-base outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15 sm:text-sm"
        />
      </div>
      <ChoiceCards
        name="compress-format"
        label="Save as"
        value={format}
        onChange={setFormat}
        className="sm:grid-cols-2"
        choices={[
          { value: "image/jpeg", title: "JPG", text: "Works on every website and form" },
          { value: "image/webp", title: "WebP", text: "Smaller, keeps see-through parts" },
        ]}
      />
      {alreadySmall ? (
        <Notice tone="warning">{files.length === 1 ? "This picture is" : "These pictures are"} already under {targetKB} KB. Choose a smaller limit.</Notice>
      ) : someSmall ? (
        <Notice>Pictures that are already small enough are kept exactly as they are.</Notice>
      ) : (
        <Notice>We find the best quality that fits, and make the picture a little smaller only when it has to be. Hidden photo details like your location are removed.</Notice>
      )}
    </Shell>
  )
}

/* ---------- Resize Image ---------- */

type ResizeMode = "fit" | "cover" | "exact"

const sizePresets = [
  { label: "WhatsApp DP", width: 500, height: 500, mode: "cover" as const },
  { label: "Instagram post", width: 1080, height: 1080, mode: "cover" as const },
  { label: "Facebook cover", width: 851, height: 315, mode: "cover" as const },
  { label: "HD (1920 wide)", width: 1920, height: 1920, mode: "fit" as const },
  { label: "Email (1024 wide)", width: 1024, height: 1024, mode: "fit" as const },
]

function NumberField({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type="number"
          min={1}
          max={10000}
          inputMode="numeric"
          value={value || ""}
          onChange={(event) => onChange(Math.min(10000, Math.max(0, Math.floor(Number(event.target.value)))))}
          className="h-11 w-full rounded-xl border bg-background pr-9 pl-3 text-base tabular-nums outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15 sm:text-sm"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">px</span>
      </div>
    </div>
  )
}

function ResizeEditor({ tool, files, setFiles, chooseFiles, onRun }: EditorProps) {
  const infoOf = useImageInfo(files)
  const first = infoOf(files[0])
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const [linked, setLinked] = useState(true)
  const [mode, setMode] = useState<ResizeMode>("fit")
  // start from the first picture's own size, halved
  const width = size?.width ?? (first && first !== "error" ? Math.round(first.width / 2) : 0)
  const height = size?.height ?? (first && first !== "error" ? Math.round(first.height / 2) : 0)
  const ratio = first && first !== "error" ? first.width / first.height : 1

  const setWidth = (value: number) => setSize({ width: value, height: linked ? Math.max(1, Math.round(value / ratio)) : height })
  const setHeight = (value: number) => setSize({ width: linked ? Math.max(1, Math.round(value * ratio)) : width, height: value })

  const run = () =>
    onRun({
      working: files.length === 1 ? "Resizing your picture" : `Resizing ${files.length} pictures`,
      run: async (signal, onProgress) => {
        const batch = await runBatch(
          files,
          async (file, signal) => {
            const type = typeOfImage(file)
            const result = await processImage(file, { type, quality: 0.92, resize: { width, height, mode, enlarge: mode !== "fit" } }, signal)
            return { bytes: result.bytes, name: `${base(file.name)} (${result.width}x${result.height}).${extensionFor[type]}` }
          },
          signal,
          onProgress
        )
        if (batch.single) {
          return {
            bytes: batch.single.bytes,
            fileName: batch.single.name,
            type: typeOfImage(files[0]),
            summary: `Resized, ${formatBytes(batch.single.bytes.length)}.`,
          }
        }
        return { bytes: batch.zip!, fileName: "Pictures (resized).zip", type: "application/zip", summary: `${files.length} pictures resized, packed in one ZIP file.` }
      },
    })

  const modeText: Record<ResizeMode, string> = {
    fit: "Each picture keeps its shape and fits inside this size. Smaller pictures are left as they are, never blown up.",
    cover: "Every picture is exactly this size. Edges that don't fit are cut off evenly.",
    exact: "Every picture is exactly this size, even if that stretches it.",
  }

  return (
    <Shell
      tool={tool}
      action={
        <ActionButton ready={files.length > 0 && width > 0 && height > 0} onClick={run}>
          {tool.actionLabel}
        </ActionButton>
      }
    >
      <ImageList
        files={files}
        setFiles={setFiles}
        chooseFiles={chooseFiles}
        multiple
        detail={(file) => {
          const info = infoOf(file)
          return `${formatBytes(file.size)}${info && info !== "error" ? ` · ${info.width} × ${info.height} px` : info === "error" ? " · can't be read" : ""}`
        }}
      />
      <div>
        <p className="text-sm font-medium">Quick sizes</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {sizePresets.map((preset) => {
            const on = width === preset.width && height === preset.height && mode === preset.mode
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setSize({ width: preset.width, height: preset.height })
                  setMode(preset.mode)
                  setLinked(preset.mode === "fit")
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm outline-none transition-colors hover:border-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/40",
                  on && "border-primary bg-primary/[0.06] font-medium"
                )}
              >
                {preset.label}
                <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                  {preset.width}×{preset.height}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <NumberField id="resize-width" label="Width" value={width} onChange={setWidth} />
        <Button
          variant="outline"
          size="icon"
          className="mb-0.5 size-10 shrink-0"
          aria-pressed={linked}
          aria-label={linked ? "Width and height are linked. Unlink them" : "Width and height are separate. Link them"}
          title={linked ? "Keeping the shape" : "Not keeping the shape"}
          onClick={() => setLinked((on) => !on)}
        >
          {linked ? <Link2 /> : <Link2Off />}
        </Button>
        <NumberField id="resize-height" label="Height" value={height} onChange={setHeight} />
      </div>
      <ChoiceCards
        name="resize-mode"
        label="How to fit"
        value={mode}
        onChange={setMode}
        className="sm:grid-cols-3"
        choices={[
          { value: "fit", title: "Fit inside", text: "Keeps the shape" },
          { value: "cover", title: "Fill and crop", text: "Exact size, edges cut" },
          { value: "exact", title: "Stretch", text: "Exact size, may squash" },
        ]}
      />
      <Notice>{modeText[mode]}</Notice>
    </Shell>
  )
}

/* ---------- Remove Background ---------- */

const backgrounds = [
  { value: "none", title: "See-through", text: "PNG with no background" },
  { value: "#ffffff", title: "White", text: "For products and forms" },
  { value: "#1e2433", title: "Dark", text: "For profile pictures" },
  { value: "custom", title: "Any colour", text: "Pick your own" },
]

function Checkerboard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-[conic-gradient(var(--color-muted)_25%,transparent_0_50%,var(--color-muted)_0_75%,transparent_0)] bg-[length:20px_20px]">
      {children}
    </div>
  )
}

function RemoveBackgroundEditor({ tool, files, chooseFiles, onRun }: EditorProps) {
  const file = files[0]
  const [choice, setChoice] = useState("none")
  const [custom, setCustom] = useState("#2f9e7a")
  const previewRef = useObjectUrlRef<HTMLImageElement>(file)
  const background = choice === "none" ? null : choice === "custom" ? custom : choice

  const run = () =>
    onRun({
      working: "Finding the subject",
      run: async (signal, onProgress) => {
        const mask = await findSubject(file, signal, (progress) =>
          // the first time, most of the wait is the model download
          onProgress(progress.stage === "download" ? (progress.loaded / Math.max(progress.total, 1)) * 0.85 : 0.9)
        )
        const canvas = await composeCutout(file, mask, background)
        const type = background ? "image/jpeg" : "image/png"
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new ImageError("The picture couldn't be saved."))), type, 0.92))
        return {
          bytes: new Uint8Array(await blob.arrayBuffer()),
          fileName: outputName(file.name, "no background", background ? "jpg" : "png"),
          type,
          summary: background ? "The background is replaced with your colour." : "The background is removed. The PNG is see-through around the subject.",
        }
      },
    })

  return (
    <Shell
      tool={tool}
      action={
        <ActionButton ready onClick={run}>
          {tool.actionLabel}
        </ActionButton>
      }
    >
      <ImageList files={files} setFiles={() => {}} chooseFiles={chooseFiles} multiple={false} detail={(f) => formatBytes(f.size)} />
      <Checkerboard>
        {/* eslint-disable-next-line @next/next/no-img-element -- a local photo preview */}
        <img ref={previewRef} alt="Your photo" className="mx-auto max-h-72 object-contain" />
      </Checkerboard>
      <ChoiceCards name="cutout-background" label="New background" value={choice} onChange={setChoice} className="grid-cols-2 sm:grid-cols-4" choices={backgrounds} />
      {choice === "custom" && (
        <div className="flex items-center gap-3">
          <label htmlFor="cutout-colour" className="text-sm font-medium">
            Background colour
          </label>
          <input
            id="cutout-colour"
            type="color"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            className="h-10 w-16 cursor-pointer rounded-lg border bg-background p-1"
          />
        </div>
      )}
      <Notice>
        A small AI model finds the subject, right here on your device. The first time, it downloads once (about 42 MB), so use Wi-Fi
        if you can. After that it is quick.
      </Notice>
    </Shell>
  )
}

/* ---------- Exports, one per tool page ---------- */

export const HeicToJpgWorkspace = ({ tool }: { tool: Tool }) => (
  <EditorWorkspace tool={tool} Editor={HeicEditor} toJob={asJob} next={["remove-background", "passport-photo", "compress-image", "resize-image"]} />
)
export const CompressImageWorkspace = ({ tool }: { tool: Tool }) => (
  <EditorWorkspace tool={tool} Editor={CompressEditor} toJob={asJob} next={["resize-image", "remove-background", "passport-photo"]} />
)
export const ResizeImageWorkspace = ({ tool }: { tool: Tool }) => (
  <EditorWorkspace tool={tool} Editor={ResizeEditor} toJob={asJob} next={["compress-image", "remove-background", "passport-photo"]} />
)
export const RemoveBackgroundWorkspace = ({ tool }: { tool: Tool }) => (
  <EditorWorkspace tool={tool} Editor={RemoveBackgroundEditor} toJob={asJob} next={["passport-photo", "compress-image", "resize-image"]} />
)
