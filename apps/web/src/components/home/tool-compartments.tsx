import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { CompartmentCard } from "@/components/home/compartment-card"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/section-heading"
import { PrivacyDot } from "@/components/tools/privacy-badge"
import { categories, tools } from "@/lib/tools"

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
        <Reveal>
          <SectionHeading
            eyebrow={`${tools.length} free tools`}
            title="What do you want to fix today?"
            description="Choose a category to see all its tools, or click a tool to start right away."
          />
          <PrivacyLegend className="mt-6 justify-center" />
        </Reveal>

        <div className="mt-10 gap-5 md:columns-2 xl:columns-3">
          {categories.map((category, i) => (
            <CompartmentCard key={category.id} id={category.id} index={i} />
          ))}
        </div>

        <Reveal className="mt-6 flex flex-col items-center gap-4">
          <Button asChild size="lg" variant="outline" className="group">
            <Link href="/tools">
              See all {tools.length} tools
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Link href="/about" className="link-underline text-sm text-muted-foreground hover:text-foreground">
            New here? See how Toolbox works
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
