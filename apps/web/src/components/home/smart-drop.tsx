"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, RefreshCw, Upload } from "lucide-react"
import { buttonVariants, Button } from "@/components/ui/button"
import { Mascot } from "@/components/brand/mascot"
import { ToolIcon } from "@/components/tools/tool-icon"
import { FileThumb } from "@/components/upload/file-thumb"
import { DropOverlay } from "@/components/upload/drop-overlay"
import { useWindowFileDrop } from "@/hooks/use-window-file-drop"
import { handOffFiles } from "@/lib/file-handoff"
import { formatBytes } from "@/lib/format"
import { fileTypeLabel, suggestToolsForFile } from "@/lib/tools"

/** "Not sure which tool?" Drop any file and get tools that can handle it. */
export function SmartDrop() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  const dragging = useWindowFileDrop((files) => setFile(files[0]))
  const suggestions = file ? suggestToolsForFile(file).slice(0, 6) : []

  const openTool = (slug: string) => {
    if (!file) return
    handOffFiles(slug, [file])
    router.push(`/tools/${slug}`)
  }

  return (
    <div className="relative rounded-3xl border bg-card p-4 shadow-2xl shadow-foreground/[0.06] sm:p-5">
      <DropOverlay
        active={dragging}
        title="Drop your file"
        description="We'll suggest the right tools for it. Nothing is uploaded."
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-5 pt-6 pb-7 text-center outline-none transition-colors hover:border-primary/60 hover:bg-primary/[0.03] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 sm:px-8"
        >
          <Mascot className="w-36 animate-float sm:w-48" />
          <span className="mt-4 font-heading text-xl font-bold sm:text-2xl">Not sure which tool?</span>
          <span className="mt-1.5 max-w-xs text-sm text-muted-foreground sm:text-base">
            Drop any file here and we&apos;ll suggest the tools that can fix it.
          </span>
          <span className={buttonVariants({ size: "lg", className: "mt-5" })}>
            <Upload />
            Choose a file
          </span>
          <span className="mt-3 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Or drag it anywhere on this page. </span>
            Nothing is uploaded.
          </span>
        </button>
      ) : (
        <div className="duration-200 animate-in fade-in-0">
          <div className="flex items-center gap-3 rounded-2xl bg-muted/70 p-3">
            <FileThumb file={file} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
                {` · ${fileTypeLabel(file)}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <RefreshCw />
              Change
            </Button>
          </div>

          {suggestions.length > 0 ? (
            <>
              <p className="mt-5 mb-3 px-1 text-sm font-semibold">What do you want to do with it?</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {suggestions.map((tool) => (
                  <li key={tool.slug}>
                    <button
                      type="button"
                      onClick={() => openTool(tool.slug)}
                      className="group flex w-full items-center gap-3 rounded-xl border bg-background p-2.5 text-left text-sm font-medium outline-none transition hover:border-primary/50 hover:bg-primary/[0.03] focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                      <ToolIcon icon={tool.icon} category={tool.category} size="sm" />
                      <span className="flex-1">{tool.name}</span>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex flex-col items-center px-4 py-6 text-center">
              <Mascot mood="oops" className="w-28" />
              <p className="mt-3 font-semibold">We don&apos;t have a tool for this file yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a PDF, photo, video or audio file.</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0]
          if (picked) setFile(picked)
          e.target.value = ""
        }}
      />
    </div>
  )
}
