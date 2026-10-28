"use client"

import dynamic from "next/dynamic"
import { AnimatePresence, m } from "motion/react"
import { Mic, Monitor, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DashedOutline } from "@/components/motion/dashed-outline"
import { useToolSession } from "@/components/tools/tool-session"
import {
  ActionButton,
  FileDropzone,
  fileKey,
  SizeBar,
  useToolFiles,
  WorkspaceFooter,
} from "@/components/tools/workspace-parts"
import { DropOverlay } from "@/components/upload/drop-overlay"
import { FileThumb } from "@/components/upload/file-thumb"
import { categoryStyles } from "@/lib/category-styles"
import { formatBytes } from "@/lib/format"
import { swapPreset } from "@/lib/motion"
import { acceptLabel, fileTypeLabel, getTool, type Tool } from "@/lib/tools"

function WorkspaceLoading() {
  return <div className="h-96 animate-pulse rounded-3xl border bg-card" aria-busy="true" aria-label="Loading tool" />
}

// Tools that work have their own workspace, loaded only on their own page
const liveWorkspaces: Record<string, React.ComponentType<{ tool: Tool }>> = {
  "merge-pdf": dynamic(() => import("@/components/tools/pdf/merge-workspace").then((mod) => mod.MergeWorkspace), {
    loading: WorkspaceLoading,
  }),
  "split-pdf": dynamic(() => import("@/components/tools/pdf/split-workspace").then((mod) => mod.SplitWorkspace), {
    loading: WorkspaceLoading,
  }),
  "organize-pdf": dynamic(
    () => import("@/components/tools/pdf/organize-workspace").then((mod) => mod.OrganizeWorkspace),
    { loading: WorkspaceLoading }
  ),
  "sign-pdf": dynamic(() => import("@/components/tools/pdf/sign-workspace").then((mod) => mod.SignWorkspace), {
    loading: WorkspaceLoading,
  }),
}

export function ToolWorkspace({ slug }: { slug: string }) {
  const tool = getTool(slug)!
  const Live = liveWorkspaces[slug]
  return Live ? <Live tool={tool} /> : <PreviewWorkspace tool={tool} />
}

/** For tools that are not built yet: try the upload area, nothing is processed */
function PreviewWorkspace({ tool }: { tool: Tool }) {
  const { files, setFiles, dragging, maxMB, fileInput, chooseFiles, removeAt } = useToolFiles(tool)
  const { text, setText } = useToolSession()
  const styles = categoryStyles[tool.category]

  const run = () =>
    toast("Mistri is still building this tool", {
      description: `${tool.name} is planned for Week ${tool.week}. ${
        tool.runsOn === "server" ? "Nothing was uploaded." : "Your files stayed on your device."
      }`,
    })

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
          {tool.input === "files" && files.length === 0 && <FileDropzone tool={tool} onChoose={chooseFiles} />}

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
                      <Button variant="ghost" size="icon" aria-label={`Remove ${file.name}`} onClick={() => removeAt(i)}>
                        <X />
                      </Button>
                    </m.li>
                  ))}
                </AnimatePresence>
              </ul>
            </m.div>
          )}
        </AnimatePresence>

        {tool.input === "files" && fileInput}

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
        <WorkspaceFooter tool={tool}>
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
          <ActionButton ready={ready} onClick={run}>
            {tool.actionLabel}
          </ActionButton>
        </WorkspaceFooter>
      )}
    </div>
  )
}
