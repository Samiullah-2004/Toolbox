"use client"

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
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { AnimatePresence, m } from "motion/react"
import { ArrowDown, ArrowUp, GripVertical, Plus, TriangleAlert, X } from "lucide-react"
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
import { pdfProblem, usePdfInfo, type PdfInfo } from "@/hooks/use-pdf-info"
import { outputName } from "@/lib/download"
import { formatBytes } from "@/lib/format"
import { swapPreset } from "@/lib/motion"
import { runPdfJob, type PageRef } from "@/lib/pdf/engine"
import type { Tool } from "@/lib/tools"

/** Merge PDF: join several PDFs into one, in the order the user arranges them */
export function MergeWorkspace({ tool }: { tool: Tool }) {
  const { files, setFiles, dragging, fileInput, chooseFiles, removeAt } = useToolFiles(tool)
  const { state, run, cancel, reset } = useToolJob()
  const infoOf = usePdfInfo(files)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // a short press on touch screens, so scrolling the page still works
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const move = (from: number, to: number) => setFiles((current) => arrayMove(current, from, to))
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = files.findIndex((f) => fileKey(f) === active.id)
    const to = files.findIndex((f) => fileKey(f) === over.id)
    move(from, to)
  }

  const infos = files.map(infoOf)
  const totalPages = infos.reduce((sum, info) => sum + (info.status === "ready" ? info.pages : 0), 0)
  const hasProblem = infos.some((info) => info.status === "error")
  const stillReading = infos.some((info) => info.status === "loading")
  const ready = files.length >= 2 && !hasProblem && !stillReading

  const merge = () =>
    run(async (signal) => {
      const pages: PageRef[] = infos.flatMap((info, doc) =>
        info.status === "ready" ? Array.from({ length: info.pages }, (_, i) => ({ doc, page: i + 1, rotate: 0 })) : []
      )
      const bytes = await runPdfJob({ kind: "assemble", files, pages }, { signal })
      return {
        bytes,
        fileName: outputName(files[0].name, "merged"),
        summary: `${files.length} files joined into one PDF with ${pages.length} pages.`,
      }
    })

  const startOver = () => {
    reset()
    setFiles([])
  }

  return (
    <div className="rounded-3xl border bg-card shadow-sm shadow-foreground/5">
      <DropOverlay active={dragging && state.status === "idle"} title="Drop to add PDFs" description="They'll be added to the end of the list." />

      <AnimatePresence mode="wait" initial={false}>
        {state.status === "working" ? (
          <WorkingPanel key="working" label={`Joining ${files.length} files`} progress={state.progress} onCancel={cancel} />
        ) : state.status === "done" ? (
          <ResultPanel
            key="done"
            tool={tool}
            result={state.result}
            nextTools={["sign-pdf", "organize-pdf", "split-pdf", "compress-pdf"]}
            onStartOver={startOver}
          />
        ) : (
          <m.div key="edit" {...swapPreset} className="p-4 sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              {files.length === 0 ? (
                <FileDropzone key="dropzone" tool={tool} onChoose={chooseFiles} />
              ) : (
                <m.div key="list" {...swapPreset} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {files.length} {files.length === 1 ? "file" : "files"}
                        {totalPages > 0 && <span className="text-muted-foreground"> &middot; {totalPages} pages in total</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Drag <GripVertical className="inline size-3.5 align-text-bottom" aria-hidden="true" /> or use the
                        arrows to set the order.
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
                          <SortableFileRow
                            key={fileKey(file)}
                            file={file}
                            index={i}
                            count={files.length}
                            info={infos[i]}
                            onMove={move}
                            onRemove={() => removeAt(i)}
                          />
                        ))}
                      </ul>
                    </SortableContext>
                  </DndContext>

                  {files.length === 1 && (
                    <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                      Add at least one more PDF to merge.
                    </p>
                  )}
                </m.div>
              )}
            </AnimatePresence>
            {fileInput}
          </m.div>
        )}
      </AnimatePresence>

      {state.status === "idle" && (
        <WorkspaceFooter tool={tool}>
          {files.length > 0 && (
            <Button variant="ghost" size="lg" onClick={() => setFiles([])}>
              Clear
            </Button>
          )}
          <ActionButton ready={ready} onClick={merge}>
            {tool.actionLabel}
          </ActionButton>
        </WorkspaceFooter>
      )}
    </div>
  )
}

function SortableFileRow({
  file,
  index,
  count,
  info,
  onMove,
  onRemove,
}: {
  file: File
  index: number
  count: number
  info: PdfInfo
  onMove: (from: number, to: number) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: fileKey(file),
  })
  const problem = pdfProblem(info)

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative flex items-center gap-2 rounded-2xl border bg-background p-2 transition-shadow sm:gap-3",
        isDragging && "z-10 scale-[1.02] shadow-xl ring-2 ring-primary/40",
        problem && "border-destructive/50"
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
      <PdfPageThumb file={file} page={1} width={44} className="w-11 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        {problem ? (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            {problem}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {info.status === "ready" ? `${info.pages} ${info.pages === 1 ? "page" : "pages"}` : "Reading..."} &middot;{" "}
            {formatBytes(file.size)}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Move ${file.name} up`}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
        >
          <ArrowUp />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Move ${file.name} down`}
          disabled={index === count - 1}
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDown />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${file.name}`} onClick={onRemove}>
          <X />
        </Button>
      </div>
    </li>
  )
}
