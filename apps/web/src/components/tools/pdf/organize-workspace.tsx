"use client"

import { useState } from "react"
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
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { AnimatePresence, m } from "motion/react"
import { RefreshCw, RotateCcw, RotateCw, Trash2, TriangleAlert, Undo2 } from "lucide-react"
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
import type { Tool } from "@/lib/tools"

interface PageItem {
  /** stable id for drag and drop */
  id: string
  /** original page number */
  page: number
  /** rotation the user added, in degrees (kept unbounded so the turn animation always goes the short way) */
  rotate: number
}

/** Reorder & Rotate: drag pages into a new order, turn pages, drop the ones you don't need */
export function OrganizeWorkspace({ tool }: { tool: Tool }) {
  const { files, setFiles, dragging, fileInput, chooseFiles } = useToolFiles(tool)
  const { state, run, cancel, reset } = useToolJob()
  const infoOf = usePdfInfo(files)
  const file = files[0]
  const info = file ? infoOf(file) : null

  const startOver = () => {
    reset()
    setFiles([])
  }

  return (
    <div className="rounded-3xl border bg-card shadow-sm shadow-foreground/5">
      <DropOverlay active={dragging && state.status === "idle"} title="Drop a PDF to organise" description="It replaces the current file." />

      <AnimatePresence mode="wait" initial={false}>
        {state.status === "working" ? (
          <WorkingPanel key="working" label="Putting your pages in order" progress={state.progress} onCancel={cancel} />
        ) : state.status === "done" ? (
          <ResultPanel
            key="done"
            tool={tool}
            result={state.result}
            nextTools={["sign-pdf", "split-pdf", "merge-pdf", "compress-pdf"]}
            onStartOver={startOver}
          />
        ) : !file ? (
          <m.div key="empty" {...swapPreset} className="p-4 sm:p-6">
            <FileDropzone tool={tool} onChoose={chooseFiles} />
          </m.div>
        ) : info?.status === "ready" ? (
          // keyed by file, so a new file starts fresh
          <PageBoard
            key={fileKey(file)}
            tool={tool}
            file={file}
            pageCount={info.pages}
            onReplace={chooseFiles}
            onSave={(items) =>
              run(async (signal) => {
                const bytes = await runPdfJob(
                  {
                    kind: "assemble",
                    files: [file],
                    pages: items.map((item) => ({ doc: 0, page: item.page, rotate: ((item.rotate % 360) + 360) % 360 })),
                  },
                  { signal }
                )
                const turned = items.filter((item) => item.rotate % 360 !== 0).length
                const removed = info.pages - items.length
                return {
                  bytes,
                  fileName: outputName(file.name, "organised"),
                  summary: [
                    `${items.length} ${items.length === 1 ? "page" : "pages"}`,
                    turned ? `${turned} turned` : null,
                    removed ? `${removed} removed` : null,
                  ]
                    .filter(Boolean)
                    .join(", ")
                    .concat("."),
                }
              })
            }
          />
        ) : (
          <m.div key="reading" {...swapPreset} className="p-4 sm:p-6">
            {info?.status === "error" ? (
              <p className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                {pdfProblem(info)}
                <Button variant="outline" size="sm" className="ml-auto" onClick={chooseFiles}>
                  Choose another
                </Button>
              </p>
            ) : (
              <div className="h-72 animate-pulse rounded-2xl bg-muted" aria-busy="true" aria-label="Reading the PDF" />
            )}
          </m.div>
        )}
      </AnimatePresence>
      {fileInput}
    </div>
  )
}

function PageBoard({
  tool,
  file,
  pageCount,
  onReplace,
  onSave,
}: {
  tool: Tool
  file: File
  pageCount: number
  onReplace: () => void
  onSave: (items: PageItem[]) => void
}) {
  const original = () => Array.from({ length: pageCount }, (_, i) => ({ id: `p${i + 1}`, page: i + 1, rotate: 0 }))
  const [items, setItems] = useState<PageItem[]>(original)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    setItems((current) => {
      const from = current.findIndex((item) => item.id === active.id)
      const to = current.findIndex((item) => item.id === over.id)
      return arrayMove(current, from, to)
    })
  }

  const rotate = (id: string, by: number) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, rotate: item.rotate + by } : item)))
  const rotateAll = (by: number) => setItems((current) => current.map((item) => ({ ...item, rotate: item.rotate + by })))
  const remove = (id: string) => setItems((current) => current.filter((item) => item.id !== id))

  const changed =
    items.length !== pageCount || items.some((item, i) => item.page !== i + 1 || item.rotate % 360 !== 0)

  return (
    <m.div key="board" {...swapPreset}>
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-2.5 pr-3">
          <PdfPageThumb file={file} page={1} width={40} className="w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {items.length} of {pageCount} pages &middot; {formatBytes(file.size)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onReplace}>
            <RefreshCw />
            Replace
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => rotateAll(-90)}>
            <RotateCcw />
            Turn all left
          </Button>
          <Button variant="outline" size="sm" onClick={() => rotateAll(90)}>
            <RotateCw />
            Turn all right
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setItems(original())} disabled={!changed}>
            <Undo2 />
            Reset
          </Button>
          <p className="w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto">Drag pages to change the order.</p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-4 py-10 text-center">
            <p className="font-medium">All pages removed</p>
            <Button variant="outline" className="mt-3" onClick={() => setItems(original())}>
              <Undo2 />
              Bring them back
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {items.map((item, index) => (
                  <SortablePage
                    key={item.id}
                    item={item}
                    position={index + 1}
                    file={file}
                    onRotate={(by) => rotate(item.id, by)}
                    onRemove={() => remove(item.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <WorkspaceFooter tool={tool}>
        <ActionButton ready={items.length > 0 && changed} onClick={() => onSave(items)}>
          {tool.actionLabel}
        </ActionButton>
      </WorkspaceFooter>
    </m.div>
  )
}

function SortablePage({
  item,
  position,
  file,
  onRotate,
  onRemove,
}: {
  item: PageItem
  position: number
  file: File
  onRotate: (by: number) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const moved = item.page !== position

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative rounded-2xl border bg-background p-2 transition-shadow",
        isDragging ? "z-10 shadow-xl ring-2 ring-primary/40" : "hover:shadow-md"
      )}
    >
      <div
        className="cursor-grab touch-manipulation rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
        aria-label={`Page ${item.page}, now in position ${position}. Press space to pick up and move.`}
        {...attributes}
        {...listeners}
      >
        <PdfPageThumb file={file} page={item.page} rotate={item.rotate} width={150} frame={1.35} className="w-full" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-0.5">
        <span className="pl-1 text-xs font-medium whitespace-nowrap tabular-nums">
          Page {item.page}
          {moved && <span className="text-primary"> &rarr; {position}</span>}
        </span>
        <span className="flex">
          <Button variant="ghost" size="icon-sm" className="size-7" aria-label={`Turn page ${item.page} left`} onClick={() => onRotate(-90)}>
            <RotateCcw />
          </Button>
          <Button variant="ghost" size="icon-sm" className="size-7" aria-label={`Turn page ${item.page} right`} onClick={() => onRotate(90)}>
            <RotateCw />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove page ${item.page}`}
            onClick={onRemove}
            className="size-7 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </span>
      </div>
    </li>
  )
}
