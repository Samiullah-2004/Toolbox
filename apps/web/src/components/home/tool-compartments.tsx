import Link from "next/link"
import { ArrowRight, ChevronRight } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/section-heading"
import { PrivacyDot } from "@/components/tools/privacy-badge"
import { ToolIcon } from "@/components/tools/tool-icon"
import { categoryStyles } from "@/lib/category-styles"
import { icons } from "@/lib/icons"
import { categories, tools, toolsInCategory } from "@/lib/tools"

export function PrivacyLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground", className)}>
      <span className="flex items-center gap-1.5">
        <PrivacyDot runsOn="browser" /> Stays on your device
      </span>
      <span className="flex items-center gap-1.5">
        <PrivacyDot runsOn="server" /> Uploaded, deleted after 1 hour
      </span>
    </div>
  )
}

/** The homepage tool list: one "compartment" per category, like a real toolbox */
export function ToolCompartments() {
  return (
    <section id="tools" className="py-16 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Open the box"
          title={`${tools.length} tools in six compartments`}
          description="Pick a compartment, then a tool. Every tool is free and shows you where your file goes."
        />
        <PrivacyLegend className="mt-6 justify-center" />

        <div className="mt-10 gap-5 md:columns-2 xl:columns-3">
          {categories.map((category) => {
            const list = toolsInCategory(category.id)
            const styles = categoryStyles[category.id]
            return (
              <div
                key={category.id}
                className="mb-5 break-inside-avoid overflow-hidden rounded-3xl border bg-card shadow-sm shadow-foreground/[0.03]"
              >
                <div className={cn("h-1.5", styles.bar)} aria-hidden="true" />
                <div className="flex items-center gap-3 p-5 pb-3">
                  <ToolIcon icon={category.icon} category={category.id} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      <span className={cn("font-semibold", styles.text)}>{category.localName}</span> &middot;{" "}
                      {list.length} tools
                    </p>
                  </div>
                </div>
                <ul className="px-2 pb-3">
                  {list.map((tool) => {
                    const Icon = icons[tool.icon]
                    return (
                      <li key={tool.slug}>
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
                        >
                          <Icon className={cn("size-4 shrink-0", styles.text)} aria-hidden="true" />
                          <span className="flex-1 font-medium">{tool.name}</span>
                          <PrivacyDot runsOn={tool.runsOn} />
                          <ChevronRight
                            className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="mt-6 text-center">
          <Button asChild size="lg" variant="outline">
            <Link href="/tools">
              Browse and search all tools
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
