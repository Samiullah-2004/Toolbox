import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "cn"
import { categoryStyles } from "@/lib/category-styles"
import type { Tool } from "@/lib/tools"
import { PrivacyBadge } from "@/components/tools/privacy-badge"
import { ToolIcon } from "@/components/tools/tool-icon"

export function ToolCard({ tool, className }: { tool: Tool; className?: string }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "group relative flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 outline-none transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50",
        categoryStyles[tool.category].hoverBorder,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <ToolIcon icon={tool.icon} category={tool.category} />
        <ArrowRight
          className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 space-y-1.5">
        <h3 className="font-sans text-base font-semibold tracking-normal">{tool.name}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
      </div>
      <PrivacyBadge runsOn={tool.runsOn} variant="short" className="self-start" />
    </Link>
  )
}
