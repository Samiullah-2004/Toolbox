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
} from "@/components/tools/workspace-parts"
import { DropOverlay } from "@/components/upload/drop-overlay"
import { runMedia, type MediaOutput } from "@/lib/media/ffmpeg"
import { swapPreset } from "@/lib/motion"
import type { Tool } from "@/lib/tools"

/** Everything an editor decides, handed to the shell to run */
export interface MediaPlan {
  inputs: File[]
  /** Builds ffmpeg's arguments: where each input can be read, and where results go */
  args: (inputs: string[], outDir: string) => string[]
  /** Shown while it runs: "Converting your video" */
  working: string
  /** Name of the file the person downloads */
  fileName: string
  type: string
  summary: (outputs: MediaOutput[]) => string
  /** When ffmpeg writes many files (like frames), they are packed in a ZIP with these names */
  zipEntryName?: (outputName: string, index: number) => string
}

export interface EditorProps {
  tool: Tool
  files: File[]
  setFiles: React.Dispatch<React.SetStateAction<File[]>>
  /** Opens the file picker: replaces the file, or adds more for tools that take several */
  chooseFiles: () => void
  onRun: (plan: MediaPlan) => void
}

/**
 * The shared frame of every audio and video tool: drop zone, then the tool's own editor,
 * then progress with a Cancel button, then the result. Each tool only supplies its editor.
 */
export function MediaWorkspace({
  tool,
  Editor,
  next = [],
}: {
  tool: Tool
  Editor: React.ComponentType<EditorProps>
  /** Tools that can take the result straight on (Jugaad Mode) */
  next?: string[]
}) {
  const { files, setFiles, dragging, fileInput, chooseFiles } = useToolFiles(tool)
  const { state, run, cancel, reset } = useToolJob()
  const [working, setWorking] = useState("Working on your file")
  const editorBox = useRef<HTMLDivElement>(null)

  const startOver = () => {
    reset()
    setFiles([])
  }

  const execute = (plan: MediaPlan) => {
    // a hidden player would keep playing out loud
    editorBox.current?.querySelectorAll("video, audio").forEach((player) => (player as HTMLMediaElement).pause())
    setWorking(plan.working)
    run(async (signal, onProgress) => {
      const outputs = await runMedia({ inputs: plan.inputs, args: plan.args, signal, onProgress })
      const summary = plan.summary(outputs)
      if (plan.zipEntryName) {
        const { zipSync } = await import("fflate")
        const sorted = [...outputs].sort((a, b) => a.name.localeCompare(b.name))
        const zipEntryName = plan.zipEntryName
        // pictures are already compressed, so they go into the ZIP as they are
        const bytes = zipSync(Object.fromEntries(sorted.map((output, i) => [zipEntryName(output.name, i), output.bytes])), { level: 0 })
        return { bytes, fileName: plan.fileName, type: "application/zip", summary }
      }
      return { bytes: outputs[0].bytes, fileName: plan.fileName, type: plan.type, summary }
    })
  }

  const file = files[0]
  return (
    <div className="rounded-3xl border bg-card shadow-sm shadow-foreground/5">
      <DropOverlay
        active={dragging && state.status === "idle"}
        title={tool.multiple ? "Drop to add more" : "Drop a file to use it"}
        description={tool.multiple ? "They'll be added to the end of the list." : "It replaces the current file."}
      />

      <AnimatePresence mode="wait" initial={false}>
        {state.status === "working" ? (
          <WorkingPanel key="working" label={working} progress={state.progress} onCancel={cancel} />
        ) : state.status === "done" ? (
          <ResultPanel key="done" tool={tool} result={state.result} nextTools={state.result.type === "application/zip" ? [] : next} onStartOver={startOver} />
        ) : !file ? (
          <m.div key="empty" {...swapPreset} className="p-4 sm:p-6">
            <FileDropzone tool={tool} onChoose={chooseFiles} />
          </m.div>
        ) : null}
      </AnimatePresence>

      {/* Kept in place, only hidden, while a job runs. If the person cancels, every choice they made is still there. */}
      {file && (
        <div ref={editorBox} hidden={state.status !== "idle"}>
          {/* keyed by file, so choosing a different file starts with fresh settings */}
          <m.div key={tool.multiple ? "editor" : fileKey(file)} {...swapPreset}>
            <Editor tool={tool} files={files} setFiles={setFiles} chooseFiles={chooseFiles} onRun={execute} />
          </m.div>
        </div>
      )}
      {fileInput}
    </div>
  )
}
