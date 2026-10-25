import { cn } from "cn"

/** A row of truck-art bunting flags. `id` must be unique on the page. */
export function TruckBorder({ id, className }: { id: string; className?: string }) {
  const patternId = `bunting-${id}`
  return (
    <svg aria-hidden="true" className={cn("block h-3 w-full", className)}>
      <defs>
        <pattern id={patternId} width="72" height="12" patternUnits="userSpaceOnUse">
          <polygon points="0,0 18,0 9,12" fill="var(--brand)" />
          <polygon points="18,0 36,0 27,12" fill="var(--saffron)" />
          <polygon points="36,0 54,0 45,12" fill="var(--teal)" />
          <polygon points="54,0 72,0 63,12" fill="var(--cat-video)" />
        </pattern>
      </defs>
      <rect width="100%" height="12" fill={`url(#${patternId})`} />
    </svg>
  )
}
