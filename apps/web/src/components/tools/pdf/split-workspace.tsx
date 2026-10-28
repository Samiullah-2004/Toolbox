"use client"

import { useState } from "react"
import { AnimatePresence, m } from "motion/react"
import { Check, FileStack, Files, RefreshCw, TriangleAlert } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { PdfPageThumb } from "@/components/tools/pdf/pdf-page-thumb"
import {
  ActionButton,
  FileDropzone,
  fileKey,
  ResultPanel,
  useToolFiles,
  useToolJob,
  WorkingPanel,
  WorkspaceFooter,
} from "@/components/tools/workspace-parts"
import { DropOverlay } from "@/components/upload/drop-overlay"
import { pdfProblem, usePdfInfo } from "@/hooks/use-pdf-info"
import { outputName } from "@/lib/download"
import { formatBytes } from "@/lib/format"
import { swapPreset } from "@/lib/motion"
import { runPdfJob } from "@/lib/pdf/engine"
import { formatPageRanges, parsePageRanges } from "@/lib/pdf/page-ranges"
import type { Tool } from "@/lib/tools"

type Mode = "one" | "each"

/** Split PDF: take out the chosen pages, as one new PDF or one PDF per page */
export function SplitWorkspace({ tool }: { tool: Tool }) {
  const { files, setFiles, dragging, fileInput, chooseFiles } = useToolFiles(tool)
  const { state, run, cancel, reset } = useToolJob()
  const infoOf = usePdfInfo(files)
  const file = files[0]

  const startOver = () => {
    reset()
    setFiles([])
  }

  return (
    <div className="rounded-3xl border bg-card shadow-sm shadow-foreground/5">
      <DropOverlay active={dragging && state.status === "idle"} title="Drop a PDF to split" description="It replaces the current file." />

      <AnimatePresence mode="wait" initial={false}>
        {state.status === "working" ? (
          <WorkingPanel key="working" label="Taking out your pages" progress={state.progress} onCancel={cancel} />
        ) : state.status === "done" ? (
          <ResultPanel
            key="done"
            tool={tool}
            result={state.result}
            nextTools={state.result.type === "application/zip" ? [] : ["sign-pdf", "organize-pdf", "merge-pdf", "compress-pdf"]}
            onStartOver={startOver}
          />
        ) : !file ? (
          <m.div key="empty" {...swapPreset} className="p-4 sm:p-6">
            <FileDropzone tool={tool} onChoose={chooseFiles} />
          </m.div>
        ) : (
          // keyed by file, so choosing a new file starts with a fresh selection
          <PagePicker
            key={fileKey(file)}
            tool={tool}
            file={file}
            pages={(() => {
              const info = infoOf(file)
              return info.status === "ready" ? info.pages : null
            })()}
            problem={pdfProblem(infoOf(file))}
            onReplace={chooseFiles}
            onSplit={(selection, mode) =>
              run(async (signal, onProgress) => {
                if (mode === "one") {
                  const bytes = await runPdfJob(
                    { kind: "assemble", files: [file], pages: selection.map((page) => ({ doc: 0, page, rotate: 0 })) },
                    { signal }
                  )
                  return {
                    bytes,
                    fileName: outputName(file.name, `pages ${formatPageRanges(selection)}`),
                    summary: `${selection.length} ${selection.length === 1 ? "page" : "pages"} saved as a new PDF.`,
                  }
                }
                const base = file.name.replace(/\.pdf$/i, "")
                const bytes = await runPdfJob(
                  {
                    kind: "split-zip",
                    files: [file],
                    pages: selection.map((page) => ({ doc: 0, page, rotate: 0 })),
                    names: selection.map((page) => `${base} - page ${page}.pdf`),
                  },
                  { signal, onProgress }
                )
                return {
                  bytes,
                  fileName: outputName(file.name, "split", "zip"),
                  type: "application/zip",
                  summary: `${selection.length} separate PDFs, packed in one ZIP file.`,
                }
              })
            }
          />
        )}
      </AnimatePresence>
      {fileInput}
    </div>
  )
}

function PagePicker({
  tool,
  file,
  pages,
  problem,
  onReplace,
  onSplit,
}: {
  tool: Tool
  file: File
  pages: number | null
  problem: string | null
  onReplace: () => void
  onSplit: (selection: number[], mode: Mode) => void
}) {
  const all = pages ? Array.from({ length: pages }, (_, i) => i + 1) : []
  // null = every page (the default until the user picks)
  const [picked, setPicked] = useState<number[] | null>(null)
  // what the user typed; null = show the current selection
  const [typed, setTyped] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("one")

  const selection = picked ?? all
  const typedIsValid = typed === null || (pages !== null && parsePageRanges(typed, pages) !== null)

  const toggle = (page: number) => {
    const next = selection.includes(page) ? selection.filter((p) => p !== page) : [...selection, page].sort((a, b) => a - b)
    setPicked(next)
    setTyped(null)
  }

  const onType = (value: string) => {
    setTyped(value)
    const parsed = pages ? parsePageRanges(value, pages) : null
    if (parsed) setPicked(parsed)
  }

  const ready = pages !== null && !problem && selection.length > 0 && typedIsValid

  return (
    <m.div key="picker" {...swapPreset}>
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-2.5 pr-3">
          <PdfPageThumb file={file} page={1} width={40} className="w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {pages ? `${pages} ${pages === 1 ? "page" : "pages"}` : problem ? "Can't be read" : "Reading..."} &middot;{" "}
              {formatBytes(file.size)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onReplace}>
            <RefreshCw />
            Replace
          </Button>
        </div>

        {problem ? (
          <p className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            {problem}
          </p>
        ) : (
          <>
            <div role="radiogroup" aria-label="How to save the pages" className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  { value: "one", icon: FileStack, title: "One new PDF", text: "The chosen pages, together in one file" },
                  { value: "each", icon: Files, title: "A PDF for each page", text: "Every chosen page as its own file (ZIP)" },
                ] as const
              ).map(({ value, icon: Icon, title, text }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={mode === value}
                  onClick={() => setMode(value)}
                  className={cn(
                    "relative isolate flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors hover:border-foreground/25",
                    mode === value && "border-primary"
                  )}
                >
                  {mode === value && (
                    <m.span layoutId="split-mode" className="absolute inset-0 -z-10 rounded-2xl bg-primary/[0.06]" />
                  )}
                  <Icon className={cn("mt-0.5 size-5 shrink-0", mode === value ? "text-primary" : "text-muted-foreground")} />
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="block text-xs text-muted-foreground">{text}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="page-ranges" className="text-sm font-medium">
                  Pages
                </label>
                <input
                  id="page-ranges"
                  value={typed ?? formatPageRanges(selection)}
                  onChange={(e) => onType(e.target.value)}
                  onBlur={() => typedIsValid && setTyped(null)}
                  placeholder="e.g. 1-3, 5"
                  disabled={!pages}
                  aria-invalid={!typedIsValid}
                  aria-describedby="page-ranges-hint"
                  className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-base outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15 aria-invalid:border-destructive sm:text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                    setPicked(null)
                    setTyped(null)
                  }} disabled={!pages}>
                  All pages
                </Button>
                <Button variant="outline" onClick={() => {
                    setPicked([])
                    setTyped(null)
                  }} disabled={!pages}>
                  None
                </Button>
              </div>
            </div>
            <p id="page-ranges-hint" className={cn("text-xs", typedIsValid ? "text-muted-foreground" : "text-destructive")}>
              {typedIsValid
                ? `${selection.length} of ${pages ?? "?"} pages chosen. Click pages below or type ranges like 1-3, 5, 8-.`
                : `Use page numbers from 1 to ${pages}, like 1-3, 5.`}
            </p>

            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {all.map((page) => {
                const on = selection.includes(page)
                return (
                  <li key={page}>
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-label={`Page ${page}`}
                      onClick={() => toggle(page)}
                      className={cn(
                        "group relative w-full rounded-xl border-2 p-1.5 pb-1 transition-all duration-200 active:scale-95",
                        on ? "border-primary bg-primary/[0.06]" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <PdfPageThumb file={file} page={page} width={130} frame={1.35} className="w-full" />
                      <span className="mt-1 block text-center text-xs font-medium tabular-nums">{page}</span>
                      <span
                        className={cn(
                          "absolute top-1 right-1 flex size-6 items-center justify-center rounded-full border-2 transition-all duration-200",
                          on ? "scale-100 border-primary bg-primary text-primary-foreground" : "scale-90 border-muted-foreground/40 bg-background"
                        )}
                        aria-hidden="true"
                      >
                        {on && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      <WorkspaceFooter tool={tool}>
        <ActionButton ready={ready} onClick={() => onSplit(selection, mode)}>
          {tool.actionLabel}
        </ActionButton>
      </WorkspaceFooter>
    </m.div>
  )
}
