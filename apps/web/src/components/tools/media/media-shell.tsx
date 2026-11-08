"use client"

import { EditorWorkspace, type EditorProps as BaseEditorProps, type Job } from "@/components/tools/editor-workspace"
import { runMedia, type MediaOutput } from "@/lib/media/ffmpeg"
import type { Tool } from "@/lib/tools"

/** Everything an audio or video editor decides, handed to the shell to run with ffmpeg */
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

export type EditorProps = BaseEditorProps<MediaPlan>

function mediaJob(plan: MediaPlan): Job {
  return {
    working: plan.working,
    run: async (signal, onProgress) => {
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
    },
  }
}

/** The frame of every audio and video tool (see EditorWorkspace); each tool supplies its editor */
export function MediaWorkspace({
  tool,
  Editor,
  next,
}: {
  tool: Tool
  Editor: React.ComponentType<EditorProps>
  next?: string[]
}) {
  return <EditorWorkspace tool={tool} Editor={Editor} toJob={mediaJob} next={next} />
}
