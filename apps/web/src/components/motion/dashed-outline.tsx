import { cn } from "cn"

/**
 * A dashed outline drawn in SVG so it follows rounded corners. The dashes stay still
 * normally and start moving while the parent `.group` is hovered or focused, showing the
 * user that this area is the target.
 */
export function DashedOutline({ radius = 16, className }: { radius?: number; className?: string }) {
  return (
    <svg aria-hidden="true" className={cn("pointer-events-none absolute inset-0 size-full overflow-visible", className)}>
      <rect
        x="1"
        y="1"
        style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
        rx={radius}
        fill="none"
        strokeWidth="2"
        strokeDasharray="10 8"
        className="stroke-border transition-colors duration-200 group-hover:stroke-primary/70 group-hover:dash-march group-focus-visible:stroke-primary group-focus-visible:dash-march"
      />
    </svg>
  )
}
