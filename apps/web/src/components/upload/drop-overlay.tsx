import { Mascot } from "@/components/brand/mascot"

/** Full-screen hint shown while a file is dragged over the page */
export function DropOverlay({
  active,
  title,
  description,
}: {
  active: boolean
  title: string
  description: string
}) {
  if (!active) return null
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-0 z-[60] flex bg-background/85 p-3 backdrop-blur-sm duration-150 animate-in fade-in-0 sm:p-6"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl border-4 border-dashed border-primary/60 bg-primary/5 px-6 text-center">
        <Mascot mood="working" className="w-36 sm:w-44" />
        <p className="font-heading text-2xl font-bold sm:text-4xl">{title}</p>
        <p className="max-w-md text-muted-foreground sm:text-lg">{description}</p>
      </div>
    </div>
  )
}
