import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "cn"
import { categoryStyles } from "@/lib/category-styles"
import type { Tool } from "@/lib/tools"
import { PrivacyBadge } from "@/components/tools/privacy-badge"
import { ToolIcon } from "@/components/tools/tool-icon"

// A slight overshoot curve, so the lift feels springy without needing JavaScript
const SPRING = "ease-[cubic-bezier(0.34,1.56,0.64,1)]"

export function ToolCard({ tool, className }: { tool: Tool; className?: string }) {
  const styles = categoryStyles[tool.category]
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-5 outline-none",
        "transition-[translate,scale,box-shadow,border-color] duration-300",
        SPRING,
        "hover:-translate-y-1 hover:shadow-xl focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0 active:scale-[0.98] active:duration-100",
        styles.hoverBorder,
        styles.glow,
        className
      )}
    >
      {/* a band of the category color that sweeps in along the top on hover */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100",
          styles.bar
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <ToolIcon
          icon={tool.icon}
          category={tool.category}
          className={cn("transition-transform duration-300 group-hover:-rotate-8 group-hover:scale-110", SPRING)}
        />
        <span className="flex size-8 items-center justify-center rounded-full bg-muted opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <ArrowRight
            className="size-4 -translate-x-1.5 transition-transform duration-300 group-hover:translate-x-0"
            aria-hidden="true"
          />
        </span>
      </div>
      <div className="flex-1 space-y-1.5">
        <h3 className="font-sans text-base font-semibold tracking-normal">{tool.name}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
      </div>
      <PrivacyBadge runsOn={tool.runsOn} variant="short" className="self-start" />
    </Link>
  )
}
