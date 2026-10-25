"use client"

import { useCallback } from "react"
import { Captions, Clapperboard, File, FileImage, FileMusic, FileText } from "lucide-react"
import { cn } from "cn"
import { detectKind, type FileKind } from "@/lib/tools"

const kindIcons: Record<FileKind, typeof File> = {
  pdf: FileText,
  image: FileImage,
  heic: FileImage,
  video: Clapperboard,
  audio: FileMusic,
  subtitle: Captions,
  any: File,
}

/** A small preview: the real picture for images, an icon for everything else */
export function FileThumb({ file, className }: { file: File; className?: string }) {
  const kind = detectKind(file)

  // React 19 ref cleanup releases the object URL when the file changes or leaves the page
  const attachPreview = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return
      const url = URL.createObjectURL(file)
      img.src = url
      return () => URL.revokeObjectURL(url)
    },
    [file]
  )

  const base = cn("size-11 shrink-0 rounded-lg", className)

  if (kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable asset
    return <img ref={attachPreview} alt="" className={cn(base, "border object-cover")} />
  }

  const Icon = kindIcons[kind ?? "any"]
  return (
    <span className={cn(base, "flex items-center justify-center bg-muted text-muted-foreground")}>
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}
