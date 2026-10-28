"use client"

// Building blocks shared by every tool workspace: getting files in, showing progress,
// and handing the result back to the user.

import { useEffectEvent, useLayoutEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { m } from "motion/react"
import { ArrowRight, CloudUpload, Download, FolderOpen, Lock, RotateCcw, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { Button, buttonVariants } from "@/components/ui/button"
import { LiveMascot } from "@/components/brand/live-mascot"
import { Mascot } from "@/components/brand/mascot"
import { DashedOutline } from "@/components/motion/dashed-outline"
import { ToolIcon } from "@/components/tools/tool-icon"
import { useToolSession } from "@/components/tools/tool-session"
import { useWindowFileDrop } from "@/hooks/use-window-file-drop"
import { categoryStyles } from "@/lib/category-styles"
import { downloadBytes } from "@/lib/download"
import { handOffFiles, receiveHandoffs } from "@/lib/file-handoff"
import { formatBytes } from "@/lib/format"
import { swapPreset } from "@/lib/motion"
import {
  acceptAttribute,
  acceptLabel,
  acceptsFile,
  getTool,
  hasPageLimit,
  maxFileSizeMB,
  SERVER_PAGE_LIMIT,
  type Tool,
} from "@/lib/tools"

// Stable keys for File objects, so list animations can track each file
const fileIds = new WeakMap<File, number>()
let nextFileId = 0
export const fileKey = (file: File) => {
  if (!fileIds.has(file)) fileIds.set(file, nextFileId++)
  return fileIds.get(file)!
}

/**
 * Everything about getting files into a tool: the file picker, dropping anywhere on the page,
 * and files handed over from another page. All of them go through the same type and size checks.
 */
export function useToolFiles(tool: Tool) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { files, setFiles, setFinished } = useToolSession()
  const maxMB = maxFileSizeMB(tool)

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
    setFinished(false)
    setFiles((current) => (tool.multiple ? [...(replace ? [] : current), ...accepted] : [accepted[0]]))
  }

  // Files handed over from another page (the home page's "Not sure which tool?", or another
  // tool's result). Next.js keeps visited pages alive and hidden, so subscribe whenever the
  // page is shown, not only on first mount. Layout effects re-run on reveal, before paint.
  const onHandoff = useEffectEvent((handed: File[]) => addFiles(handed, { replace: true }))
  useLayoutEffect(() => receiveHandoffs(tool.slug, (handed) => onHandoff(handed)), [tool.slug])

  const dragging = useWindowFileDrop(addFiles, tool.input === "files")

  const fileInput = (
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
  )

  return {
    files,
    setFiles,
    addFiles,
    dragging,
    maxMB,
    fileInput,
    chooseFiles: () => inputRef.current?.click(),
    removeAt: (index: number) => setFiles((current) => current.filter((_, i) => i !== index)),
  }
}

/** The big "drop your file here" area */
export function FileDropzone({ tool, onChoose }: { tool: Tool; onChoose: () => void }) {
  const maxMB = maxFileSizeMB(tool)
  return (
    <m.button
      key="dropzone"
      {...swapPreset}
      type="button"
      onClick={onChoose}
      className="group relative flex min-h-72 w-full flex-col items-center justify-center gap-5 rounded-2xl px-6 py-10 text-center outline-none transition-colors hover:bg-primary/[0.03] focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <DashedOutline />
      <span
        className={cn(
          "flex size-16 animate-breathe items-center justify-center rounded-2xl transition-transform duration-300 group-hover:[animation-play-state:paused]",
          categoryStyles[tool.category].tile
        )}
      >
        <CloudUpload
          className="size-8 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110"
          aria-hidden="true"
        />
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
  )
}

/** How much of the tool's size limit a file uses. Amber when it gets close. */
export function SizeBar({ size, maxMB }: { size: number; maxMB: number }) {
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

/** The bar under a workspace: where the file goes on the left, actions on the right */
export function WorkspaceFooter({ tool, children }: { tool: Tool; children: React.ReactNode }) {
  return (
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
      <div className="flex gap-2">{children}</div>
    </div>
  )
}

/** The main action button. Gives a small bounce the moment it becomes usable. */
export function ActionButton({
  ready,
  onClick,
  children,
}: {
  ready: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <m.div
      key={ready ? "ready" : "idle"}
      initial={ready ? { scale: 0.9 } : false}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 14 }}
      className="flex flex-1 sm:flex-none"
    >
      <Button size="lg" onClick={onClick} disabled={!ready} className="group w-full">
        {children}
        <ArrowRight className="transition-transform group-hover:translate-x-1" />
      </Button>
    </m.div>
  )
}

/* ---------- Running a job ---------- */

export interface ToolResult {
  bytes: Uint8Array
  fileName: string
  type?: string
  /** One line about what happened, e.g. "3 files, 12 pages" */
  summary: string
}

type JobState =
  | { status: "idle" }
  | { status: "working"; progress: number | null }
  | { status: "done"; result: ToolResult }

/**
 * Runs a tool's work with visible progress, a Cancel button, friendly errors and a result.
 * The work function receives an AbortSignal and a progress callback.
 */
export function useToolJob() {
  const { setFinished } = useToolSession()
  const [state, setState] = useState<JobState>({ status: "idle" })
  const controller = useRef<AbortController | null>(null)

  const run = async (
    work: (signal: AbortSignal, onProgress: (fraction: number) => void) => Promise<ToolResult>
  ) => {
    controller.current = new AbortController()
    setState({ status: "working", progress: null })
    try {
      const result = await work(controller.current.signal, (progress) => setState({ status: "working", progress }))
      setState({ status: "done", result })
      setFinished(true)
    } catch (error) {
      setState({ status: "idle" })
      if (error instanceof DOMException && error.name === "AbortError") {
        toast("Stopped", { description: "Nothing was changed. Your files are still here." })
        return
      }
      toast.error("Oops, the toolbox got stuck", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    }
  }

  return {
    state,
    run,
    cancel: () => controller.current?.abort(),
    reset: () => {
      setState({ status: "idle" })
      setFinished(false)
    },
  }
}

/** Shown while a job runs: Mistri at work, progress, and a way to stop */
export function WorkingPanel({ label, progress, onCancel }: { label: string; progress: number | null; onCancel: () => void }) {
  return (
    <m.div
      key="working"
      {...swapPreset}
      role="status"
      aria-live="polite"
      className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-10 text-center"
    >
      <Mascot mood="working" className="w-32" label="Mistri at work" />
      <div>
        <p className="font-heading text-xl font-semibold">Mistri is working on it...</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
        {progress === null ? (
          // no exact progress: a bar that sweeps back and forth
          <m.div
            className="h-full w-1/3 rounded-full bg-primary"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <m.div className="h-full rounded-full bg-primary" animate={{ width: `${Math.round(progress * 100)}%` }} />
        )}
      </div>
      <Button variant="ghost" onClick={onCancel}>
        <X />
        Cancel
      </Button>
    </m.div>
  )
}

/** Shown when the result is ready: download it, or send it straight into another tool */
export function ResultPanel({
  tool,
  result,
  nextTools = [],
  onStartOver,
}: {
  tool: Tool
  result: ToolResult
  /** Tools the result can go into next (Jugaad Mode) */
  nextTools?: string[]
  onStartOver: () => void
}) {
  const router = useRouter()
  const type = result.type ?? "application/pdf"

  const sendTo = (slug: string) => {
    handOffFiles(slug, [new File([result.bytes as BlobPart], result.fileName, { type })])
    router.push(`/tools/${slug}`)
  }

  return (
    <m.div key="done" {...swapPreset} className="flex flex-col items-center px-4 py-8 text-center sm:px-6">
      <m.div
        initial={{ scale: 0.6, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 14 }}
      >
        <LiveMascot className="w-32" />
      </m.div>
      <p className="mt-3 font-heading text-2xl font-bold">Your file is ready. Chai time!</p>
      <p className="mt-1 text-sm text-muted-foreground">{result.summary}</p>

      <div className="mt-5 flex w-full max-w-md items-center gap-3 rounded-2xl border bg-background p-3 text-left">
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", categoryStyles[tool.category].tile)}>
          <Download className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{result.fileName}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(result.bytes.length)}</p>
        </div>
      </div>

      <div className="mt-5 flex w-full max-w-md flex-col gap-2 sm:flex-row">
        <Button size="lg" className="group flex-1" onClick={() => downloadBytes(result.bytes, result.fileName, type)}>
          <Download className="transition-transform group-hover:translate-y-0.5" />
          Download
        </Button>
        <Button size="lg" variant="outline" onClick={onStartOver}>
          <RotateCcw />
          Start over
        </Button>
      </div>

      {nextTools.length > 0 && (
        <div className="mt-8 w-full max-w-md border-t pt-5">
          <p className="text-sm font-semibold">Keep going with this file</p>
          <p className="text-xs text-muted-foreground">Jugaad Mode: no need to download and upload it again.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {nextTools.map((slug) => {
              const next = getTool(slug)!
              return (
                <li key={slug}>
                  <button
                    type="button"
                    onClick={() => sendTo(slug)}
                    className="group flex w-full items-center gap-3 rounded-xl border bg-background p-2.5 text-left text-sm font-medium outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.98]"
                  >
                    <ToolIcon icon={next.icon} category={next.category} size="sm" />
                    <span className="flex-1">{next.name}</span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </m.div>
  )
}
