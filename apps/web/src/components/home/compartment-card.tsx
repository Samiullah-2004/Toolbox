"use client"

import { useState } from "react"
import Link from "next/link"
import { m } from "motion/react"
import { ArrowRight, ChevronRight } from "lucide-react"
import { cn } from "cn"
import { Reveal } from "@/components/motion/reveal"
import { PrivacyDot } from "@/components/tools/privacy-badge"
import { ToolIcon } from "@/components/tools/tool-icon"
import { categoryStyles } from "@/lib/category-styles"
import { icons } from "@/lib/icons"
import { getCategory, toolsInCategory, type CategoryId } from "@/lib/tools"

/**
 * One "compartment" of the toolbox. Reveals as it scrolls into view, lifts on hover,
 * and a highlight glides between tool rows to follow the mouse.
 */
export function CompartmentCard({ id, index }: { id: CategoryId; index: number }) {
  const category = getCategory(id)
  const list = toolsInCategory(id)
  const styles = categoryStyles[id]
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <Reveal delay={(index % 3) * 80} className="mb-5 break-inside-avoid">
      <div
        className={cn(
          "group/card overflow-hidden rounded-3xl border bg-card shadow-sm shadow-foreground/[0.03] transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-xl",
          styles.glow
        )}
      >
        <div className={cn("h-1.5 transition-[height] duration-300 group-hover/card:h-2.5", styles.bar)} aria-hidden="true" />
        <Link
          href={`/category/${id}`}
          className="group flex items-center gap-3 p-5 pb-3 outline-none focus-visible:bg-muted"
        >
          <ToolIcon
            icon={category.icon}
            category={id}
            className="transition-transform duration-300 group-hover/card:-rotate-6 group-hover/card:scale-110"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold">
              <span className="link-underline">{category.name}</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              <span className={cn("font-semibold", styles.text)}>{category.localName}</span> &middot; {list.length}{" "}
              tools
            </p>
          </div>
          <span className="flex size-9 items-center justify-center rounded-full transition-colors group-hover:bg-muted">
            <ArrowRight
              className="size-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-foreground"
              aria-hidden="true"
            />
          </span>
        </Link>

        <ul className="px-2 pb-1" onMouseLeave={() => setHovered(null)}>
          {list.map((tool) => {
            const Icon = icons[tool.icon]
            return (
              <li key={tool.slug}>
                <Link
                  href={`/tools/${tool.slug}`}
                  onMouseEnter={() => setHovered(tool.slug)}
                  onFocus={() => setHovered(tool.slug)}
                  onBlur={() => setHovered(null)}
                  className="group relative isolate flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none"
                >
                  {hovered === tool.slug && (
                    <m.span
                      layoutId={`row-${id}`}
                      className="absolute inset-0 -z-10 rounded-xl bg-muted"
                      transition={{ type: "spring", stiffness: 520, damping: 40 }}
                    />
                  )}
                  <Icon
                    className={cn("size-4 shrink-0 transition-transform duration-200 group-hover:scale-125", styles.text)}
                    aria-hidden="true"
                  />
                  <span className="flex-1 font-medium transition-transform duration-200 group-hover:translate-x-0.5">
                    {tool.name}
                  </span>
                  <PrivacyDot runsOn={tool.runsOn} />
                  <ChevronRight
                    className="size-4 -translate-x-1 text-muted-foreground opacity-40 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            )
          })}
        </ul>

        <Link
          href={`/category/${id}`}
          className={cn(
            "group mx-2 mb-2 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
            styles.soft,
            styles.text
          )}
        >
          Open {category.shortName} tools
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </Reveal>
  )
}
