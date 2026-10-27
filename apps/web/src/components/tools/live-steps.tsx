"use client"

import { AnimatePresence, m } from "motion/react"
import { Check } from "lucide-react"
import { cn } from "cn"
import { useToolSession } from "@/components/tools/tool-session"
import type { InputMode } from "@/lib/tools"

/**
 * "How to use" steps that follow the user's progress: step 1 ticks off as soon as a
 * file (or text) is added, and the next step is highlighted. This keeps the user
 * informed about where they are in the task (visibility of system status).
 */
export function LiveSteps({ title, steps, input }: { title: string; steps: string[]; input: InputMode }) {
  const { files, text } = useToolSession()
  const started = input === "files" ? files.length > 0 : input === "text" ? text.trim().length > 0 : false
  const current = started ? 1 : 0

  return (
    <div className="rounded-3xl border bg-card p-5">
      <h2 className="font-sans text-base font-semibold tracking-normal">{title}</h2>
      <ol className="mt-4 space-y-1">
        {steps.map((step, i) => {
          const done = i < current
          const active = i === current
          return (
            <li
              key={i}
              aria-current={active ? "step" : undefined}
              className={cn(
                "relative flex gap-3 rounded-xl p-2 transition-colors duration-300",
                active && "bg-primary/[0.07]"
              )}
            >
              <span
                className={cn(
                  "relative flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300",
                  done ? "bg-success text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {/* a soft pulse around the step the user should do next */}
                {active && (
                  <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-primary/30 [animation-duration:2s]" />
                )}
                <AnimatePresence mode="wait" initial={false}>
                  {done ? (
                    <m.span
                      key="done"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <Check className="size-4" strokeWidth={3} />
                      <span className="sr-only">Done:</span>
                    </m.span>
                  ) : (
                    <m.span key="num" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      {i + 1}
                    </m.span>
                  )}
                </AnimatePresence>
              </span>
              <span
                className={cn(
                  "pt-0.5 text-sm leading-relaxed transition-colors duration-300",
                  done ? "text-muted-foreground line-through decoration-muted-foreground/40" : active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
