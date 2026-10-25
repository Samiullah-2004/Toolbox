import type { CategoryId } from "@/lib/tools"

// Full class names so Tailwind can see them at build time.
export const categoryStyles: Record<
  CategoryId,
  { text: string; tile: string; hoverBorder: string; bar: string; soft: string }
> = {
  pdf: {
    text: "text-cat-pdf",
    tile: "bg-cat-pdf/12 text-cat-pdf",
    hoverBorder: "hover:border-cat-pdf/50",
    bar: "bg-cat-pdf",
    soft: "bg-cat-pdf/6",
  },
  video: {
    text: "text-cat-video",
    tile: "bg-cat-video/12 text-cat-video",
    hoverBorder: "hover:border-cat-video/50",
    bar: "bg-cat-video",
    soft: "bg-cat-video/6",
  },
  audio: {
    text: "text-cat-audio",
    tile: "bg-cat-audio/12 text-cat-audio",
    hoverBorder: "hover:border-cat-audio/50",
    bar: "bg-cat-audio",
    soft: "bg-cat-audio/6",
  },
  image: {
    text: "text-cat-image",
    tile: "bg-cat-image/12 text-cat-image",
    hoverBorder: "hover:border-cat-image/50",
    bar: "bg-cat-image",
    soft: "bg-cat-image/6",
  },
  speech: {
    text: "text-cat-speech",
    tile: "bg-cat-speech/12 text-cat-speech",
    hoverBorder: "hover:border-cat-speech/50",
    bar: "bg-cat-speech",
    soft: "bg-cat-speech/6",
  },
  utility: {
    text: "text-cat-utility",
    tile: "bg-cat-utility/12 text-cat-utility",
    hoverBorder: "hover:border-cat-utility/50",
    bar: "bg-cat-utility",
    soft: "bg-cat-utility/6",
  },
}
