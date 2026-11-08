"use client"

import Link from "next/link"
import { m } from "motion/react"
import { Check, Workflow, X } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { leaveChain, useChainStep } from "@/lib/jugaad-store"
import { getTool } from "@/lib/tools"

/** Shown above a tool when it is a step of a Jugaad chain: where you are, and what comes next */
export function ChainBar({ slug }: { slug: string }) {
  const step = useChainStep(slug)
  if (!step) return null
  const { chain, index } = step

  return (
    <m.nav
      aria-label="Jugaad Mode steps"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/25 bg-primary/[0.05] p-3 sm:p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-sm">
          <Workflow className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <span className="font-semibold">Jugaad Mode:</span> {chain.title}
            <span className="text-muted-foreground">
              {" "}
              &middot; step {index + 1} of {chain.steps.length}
            </span>
          </span>
        </p>
        <Button variant="ghost" size="icon-sm" aria-label="Leave Jugaad Mode" title="Leave Jugaad Mode" onClick={leaveChain}>
          <X />
        </Button>
      </div>
      <ol className="mt-3 flex flex-wrap items-center gap-1.5">
        {chain.steps.map((stepSlug, i) => {
          const tool = getTool(stepSlug)!
          const state = i < index ? "done" : i === index ? "current" : "next"
          const label = (
            <>
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[0.7rem] font-bold tabular-nums",
                  state === "done" ? "bg-success text-white" : state === "current" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
                aria-hidden="true"
              >
                {state === "done" ? <Check className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              {tool.name}
            </>
          )
          return (
            <li key={stepSlug} className="flex items-center gap-1.5">
              {i > 0 && <span className="h-px w-3 bg-border" aria-hidden="true" />}
              {state === "current" ? (
                <span aria-current="step" className="flex items-center gap-1.5 rounded-full bg-card py-1 pr-2.5 pl-1 text-xs font-semibold shadow-sm ring-1 ring-primary/30">
                  {label}
                </span>
              ) : (
                <Link
                  href={`/tools/${stepSlug}`}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-xs transition-colors hover:bg-card",
                    state === "next" && "text-muted-foreground"
                  )}
                >
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </m.nav>
  )
}
