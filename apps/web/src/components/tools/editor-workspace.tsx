"use client"

import { useRef, useState } from "react"
import { AnimatePresence, m } from "motion/react"
import {
  fileKey,
  FileDropzone,
  ResultPanel,
  useToolFiles,
  useToolJob,
  WorkingPanel,
  type ToolResult,
} from "@/components/tools/workspace-parts"
import { useToolSession } from "@/components/tools/tool-session"
import { DropOverlay } from "@/components/upload/drop-overlay"
import { swapPreset } from "@/lib/motion"
import type { Tool } from "@/lib/tools"

/** One run of a tool: what to show while it works, and the work itself */
export interface Job {
  /** Shown while it runs: "Converting your video" */
  working: string
  run: (signal: AbortSignal, onProgress: (fraction: number) => void) => Promise<ToolResult>
}

export interface EditorProps<Plan = Job> {
  tool: Tool
  files: File[]
  setFiles: React.Dispatch<React.SetStateAction<File[]>>
  /** Opens the file picker: replaces the file, or adds more for tools that take several */
  chooseFiles: () => void
  onRun: (plan: Plan) => void
}

/**
 * The shared frame of the tools: drop zone, then the tool's own editor, then progress with a
 * Cancel button, then the result. Each tool only supplies its editor, which decides what to do
 * and hands back a plan. Tools that don't start from a file (QR codes, recording) skip the drop zone.
 */
export function EditorWorkspace<Plan>({
  tool,
  Editor,
  toJob,
  next = [],
}: {
  tool: Tool
  Editor: React.ComponentType<EditorProps<Plan>>
  /** Turns the editor's plan into work to run */
  toJob: (plan: Plan) => Job
  /** Tools that can take the result straight on (Jugaad Mode), or a function choosing them from the result */
  next?: string[] | ((result: ToolResult) => string[])
}) {
  const { files, setFiles, dragging, fileInput, chooseFiles } = useToolFiles(tool)
  const { setText } = useToolSession()
  // bumped by Start over, so a tool without a file (QR code, recorder) also starts with a fresh form
  const [round, setRound] = useState(0)
  const { state, run, cancel, reset } = useToolJob()
  const [working, setWorking] = useState("Working on your file")
  const editorBox = useRef<HTMLDivElement>(null)
  const takesFiles = tool.input === "files"

  const startOver = () => {
    reset()
    setFiles([])
    setText("")
    setRound((n) => n + 1)
  }

  const execute = (plan: Plan) => {
    // a hidden player would keep playing out loud
    editorBox.current?.querySelectorAll("video, audio").forEach((player) => (player as HTMLMediaElement).pause())
    const job = toJob(plan)
    setWorking(job.working)
    run(job.run)
  }

  const file = files[0]
  const hasInput = !takesFiles || !!file

  // The drop zone, progress and result panels fade out before the editor shows. Showing both at
  // once for that moment would make the editor jump up by a whole panel's height, right as the
  // person reaches for it.
  const panelShown = state.status !== "idle" || !hasInput
  const [panelGone, setPanelGone] = useState(!panelShown)
  const [lastPanelShown, setLastPanelShown] = useState(panelShown)
  if (panelShown !== lastPanelShown) {
    setLastPanelShown(panelShown)
    if (panelShown) setPanelGone(false)
  }
  const showEditor = !panelShown && panelGone

  return (
    <div className="rounded-3xl border bg-card shadow-sm shadow-foreground/5">
      {takesFiles && (
        <DropOverlay
          active={dragging && state.status === "idle"}
          title={tool.multiple ? "Drop to add more" : "Drop a file to use it"}
          description={tool.multiple ? "They'll be added to the end of the list." : "It replaces the current file."}
        />
      )}

      <AnimatePresence mode="wait" initial={false} onExitComplete={() => setPanelGone(true)}>
        {state.status === "working" ? (
          <WorkingPanel key="working" label={working} progress={state.progress} onCancel={cancel} />
        ) : state.status === "done" ? (
          <ResultPanel
            key="done"
            tool={tool}
            result={state.result}
            nextTools={state.result.type === "application/zip" ? [] : typeof next === "function" ? next(state.result) : next}
            onStartOver={startOver}
          />
        ) : !hasInput ? (
          <m.div key="empty" {...swapPreset} className="p-4 sm:p-6">
            <FileDropzone tool={tool} onChoose={chooseFiles} />
          </m.div>
        ) : null}
      </AnimatePresence>

      {/* Kept in place, only hidden, while a job runs. If the person cancels, every choice they made is still there. */}
      {hasInput && (
        <div ref={editorBox} hidden={!showEditor}>
          {/* keyed by file, so choosing a different file starts with fresh settings */}
          <m.div
            key={tool.multiple || !file ? `editor-${round}` : fileKey(file)}
            initial={swapPreset.initial}
            animate={showEditor ? swapPreset.animate : swapPreset.initial}
            transition={swapPreset.transition}
          >
            <Editor tool={tool} files={files} setFiles={setFiles} chooseFiles={chooseFiles} onRun={execute} />
          </m.div>
        </div>
      )}
      {takesFiles && fileInput}
    </div>
  )
}

/** Plain tools hand back a ready job */
export const asJob = (job: Job) => job
