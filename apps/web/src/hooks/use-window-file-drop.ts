"use client"

import { useEffect, useEffectEvent, useState } from "react"

/**
 * Lets the user drop files anywhere on the page.
 * Returns true while files are being dragged over the window.
 */
export function useWindowFileDrop(onFiles: (files: File[]) => void, enabled = true) {
  const [dragging, setDragging] = useState(false)
  const handleFiles = useEffectEvent(onFiles)

  useEffect(() => {
    if (!enabled) return
    // dragenter/dragleave fire for every child element, so count depth
    let depth = 0
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files") ?? false

    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth++
      setDragging(true)
    }
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"
    }
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth = 0
      setDragging(false)
      const files = Array.from(e.dataTransfer?.files ?? [])
      if (files.length) handleFiles(files)
    }

    window.addEventListener("dragenter", onEnter)
    window.addEventListener("dragover", onOver)
    window.addEventListener("dragleave", onLeave)
    window.addEventListener("drop", onDrop)
    return () => {
      window.removeEventListener("dragenter", onEnter)
      window.removeEventListener("dragover", onOver)
      window.removeEventListener("dragleave", onLeave)
      window.removeEventListener("drop", onDrop)
    }
  }, [enabled])

  return enabled && dragging
}
