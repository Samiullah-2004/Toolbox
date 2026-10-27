"use client"

import { useEffectEvent, useLayoutEffect, useRef } from "react"
import { AnimatePresence, m } from "motion/react"
import { ArrowRight, CloudUpload, FolderOpen, Lock, Mic, Monitor, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { Button, buttonVariants } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DashedOutline } from "@/components/motion/dashed-outline"
import { useToolSession } from "@/components/tools/tool-session"
import { DropOverlay } from "@/components/upload/drop-overlay"
import { FileThumb } from "@/components/upload/file-thumb"
import { useWindowFileDrop } from "@/hooks/use-window-file-drop"
import { categoryStyles } from "@/lib/category-styles"
import { receiveHandoffs } from "@/lib/file-handoff"
import { formatBytes } from "@/lib/format"
import { swapPreset } from "@/lib/motion"
import {
  acceptAttribute,
  acceptLabel,
  acceptsFile,
  fileTypeLabel,
  getTool,
  hasPageLimit,
  maxFileSizeMB,
  SERVER_PAGE_LIMIT,
} from "@/lib/tools"

// Stable keys for File objects, so list animations can track each file
const fileIds = new WeakMap<File, number>()
let nextFileId = 0
const fileKey = (file: File) => {
  if (!fileIds.has(file)) fileIds.set(file, nextFileId++)
  return fileIds.get(file)!
}

export function ToolWorkspace({ slug }: { slug: string }) {
  const tool = getTool(slug)!
  const inputRef = useRef<HTMLInputElement>(null)
  const { files, setFiles, text, setText } = useToolSession()
  const maxMB = maxFileSizeMB(tool)
  const styles = categoryStyles[tool.category]

  /** Every way in (picker, drop, handoff) goes through the same type and size checks */
  const addFiles = (incoming: File[], { replace = false } = {}) => {
    const wrongType = incoming.filter((f) => !acceptsFile(tool, f))
    const tooBig = incoming.filter((f) => acceptsFile(tool, f) && f.size > maxMB * 1024 * 1024)
    const accepted = incoming.filter((f) => !wrongType.includes(f) && !tooBig.includes(f))

    if (wrongType.length) {
      toast.error(
        wrongType.length === 1
          ? `"${wrongType[0].name}" can't be used here`
          : `${wrongType.length} files can't be used here`,
        { description: `${tool.name} accepts: ${acceptLabel(tool)}.` }
      )
    }
    if (tooBig.length) {
      toast.error(tooBig.length === 1 ? `"${tooBig[0].name}" is too large` : `${tooBig.length} files are too large`, {
        description: `Files for ${tool.name} must be under ${maxMB} MB${tool.multiple ? " each" : ""}.`,
      })
    }
    if (!accepted.length) return
    setFiles((current) =>
      tool.multiple ? [...(replace ? [] : current), ...accepted] : [accepted[0]]
    )
  }

  // Files handed over from another page (e.g. the home page's "Not sure which tool?").
  // Next.js keeps visited pages alive and hidden, so we subscribe whenever the page is
  // shown, not only on first mount. Layout effects re-run on reveal, before paint.
  const onHandoff = useEffectEvent((handed: File[]) => addFiles(handed, { replace: true }))
  useLayoutEffect(() => receiveHandoffs(slug, (handed) => onHandoff(handed)), [slug])

  const dragging = useWindowFileDrop(addFiles, tool.input === "files")

  const run = () =>
    toast("Mistri is still building this tool", {
      description: `${tool.name} is planned for Week ${tool.week}. ${
        tool.runsOn === "server" ? "Nothing was uploaded." : "Your files stayed on your device."
      }`,
    })

  const chooseFiles = () => inputRef.current?.click()
  const ready = tool.input === "files" ? files.length > 0 : tool.input === "text" && text.trim().length > 0
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="rounded-3xl border bg-card shadow-sm shadow-foreground/5">
      <DropOverlay
        active={dragging}
        title={`Drop to add to ${tool.name}`}
        description={`${acceptLabel(tool)}, up to ${maxMB} MB${tool.multiple ? " each" : ""}.`}
      />

      <div className="p-4 sm:p-6">
        <AnimatePresence mode="wait" initial={false}>
        {tool.input === "files" && files.length === 0 && (
          <m.button
            key="dropzone"
            {...swapPreset}
            type="button"
            onClick={chooseFiles}
            className={cn(
              "group relative flex min-h-72 w-full flex-col items-center justify-center gap-5 rounded-2xl px-6 py-10 text-center outline-none transition-colors",
              "hover:bg-primary/[0.03] focus-visible:ring-3 focus-visible:ring-ring/40"
            )}
          >
            <DashedOutline />
            <span
              className={cn(
                "flex size-16 animate-breathe items-center justify-center rounded-2xl transition-transform duration-300 group-hover:[animation-play-state:paused]",
                styles.tile
              )}
            >
              <CloudUpload className="size-8 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110" aria-hidden="true" />
            </span>
            <span className="space-y-1.5">
              <span className="block font-heading text-xl font-semibold sm:text-2xl">
                <span className="sm:hidden">Tap to choose your {tool.multiple ? "files" : "file"}</span>
                <span className="hidden sm:inline">Drop your {tool.multiple ? "files" : "file"} here</span>
              </span>
              <span className="block text-sm text-muted-foreground">
                {acceptLabel(tool)} &middot; up to {maxMB} MB{tool.multiple ? " each" : ""}
                {hasPageLimit(tool) && ` · max ${SERVER_PAGE_LIMIT} pages`}
              </span>
            </span>
            <span className={buttonVariants({ size: "lg", className: "group-hover:shadow-md" })}>
              <FolderOpen className="transition-transform group-hover:-rotate-6" />
              Choose {tool.multiple ? "files" : "file"}
            </span>
          </m.button>
        )}

        {tool.input === "files" && files.length > 0 && (
          <m.div key="files" {...swapPreset} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {files.length} {files.length === 1 ? "file" : "files"} selected
                <span className="text-muted-foreground"> &middot; {formatBytes(totalSize)}</span>
              </p>
              <Button variant="outline" size="sm" onClick={chooseFiles}>
                <Plus />
                {tool.multiple ? "Add more" : "Replace"}
              </Button>
            </div>
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
              {files.map((file, i) => (
                <m.li
                  key={fileKey(file)}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -40, transition: { duration: 0.18 } }}
                  className="flex items-center gap-3 rounded-2xl border bg-background p-2.5 pr-1.5 transition-colors hover:border-foreground/20"
                >
                  {tool.multiple && (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                      {i + 1}
                    </span>
                  )}
                  <FileThumb file={file} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)} &middot; {fileTypeLabel(file)}
                    </p>
                    <SizeBar size={file.size} maxMB={maxMB} />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((current) => current.filter((_, j) => j !== i))}
                  >
                    <X />
                  </Button>
                </m.li>
              ))}
              </AnimatePresence>
            </ul>
          </m.div>
        )}
        </AnimatePresence>

        {tool.input === "files" && (
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={acceptAttribute(tool)}
            multiple={tool.multiple}
            onChange={(e) => {
              addFiles(Array.from(e.target.files ?? []))
              e.target.value = ""
            }}
          />
        )}

        {tool.input === "text" && (
          <div className="space-y-2">
            <label htmlFor="tool-text" className="text-sm font-medium">
              {tool.textLabel}
            </label>
            <Textarea
              id="tool-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={tool.textPlaceholder}
              rows={7}
              className="min-h-44 resize-y rounded-xl text-base"
            />
            <p className="text-right text-xs text-muted-foreground tabular-nums">{text.length} characters</p>
          </div>
        )}

        {tool.input === "record" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Monitor, title: "Record screen", text: "A browser tab, one window or your whole screen" },
              { icon: Mic, title: "Record voice", text: "Only your microphone, saved as audio" },
            ].map(({ icon: Icon, title, text }) => (
              <button
                key={title}
                type="button"
                onClick={run}
                className="group relative flex flex-col items-start gap-4 rounded-2xl p-6 text-left outline-none transition-all duration-300 hover:-translate-y-1 hover:bg-primary/[0.03] focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.98]"
              >
                <DashedOutline />
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6",
                    styles.tile
                  )}
                >
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-heading text-lg font-semibold">{title}</span>
                  <span className="block text-sm text-muted-foreground">{text}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {tool.input !== "record" && (
        <div className="flex flex-col-reverse gap-3 rounded-b-3xl border-t bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            {tool.runsOn === "browser" ? (
              <Lock className="size-3.5 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <CloudUpload className="size-3.5 shrink-0 text-teal" aria-hidden="true" />
            )}
            {tool.runsOn === "browser"
              ? "Runs in your browser. Your files never leave this device."
              : "Uploaded securely and deleted after 1 hour."}
          </p>
          <div className="flex gap-2">
            {ready && (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  setFiles([])
                  setText("")
                }}
              >
                Clear
              </Button>
            )}
            {/* the button gives a small bounce the moment it becomes usable */}
            <m.div
              key={ready ? "ready" : "idle"}
              initial={ready ? { scale: 0.9 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 14 }}
              className="flex flex-1 sm:flex-none"
            >
              <Button size="lg" onClick={run} disabled={!ready} className="group w-full">
                {tool.actionLabel}
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Button>
            </m.div>
          </div>
        </div>
      )}
    </div>
  )
}

/** How much of the tool's size limit a file uses. Amber when it gets close. */
function SizeBar({ size, maxMB }: { size: number; maxMB: number }) {
  const ratio = Math.min(size / (maxMB * 1024 * 1024), 1)
  const percent = Math.max(Math.round(ratio * 100), 1)
  return (
    <div className="mt-1.5 flex items-center gap-2" title={`${percent}% of the ${maxMB} MB limit`}>
      <div
        role="meter"
        aria-label="File size compared to the limit"
        aria-valuemin={0}
        aria-valuemax={maxMB}
        aria-valuenow={Number((size / 1024 / 1024).toFixed(2))}
        className="h-1 w-full max-w-40 overflow-hidden rounded-full bg-muted"
      >
        <m.div
          className={cn("h-full rounded-full", ratio > 0.8 ? "bg-warning" : "bg-success")}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
      </div>
      <span className="shrink-0 text-[0.7rem] text-muted-foreground tabular-nums">of {maxMB} MB</span>
    </div>
  )
}
