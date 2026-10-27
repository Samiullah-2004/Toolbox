"use client"

import { AnimatePresence, m } from "motion/react"
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
  return (
    <AnimatePresence>
      {active && (
        <m.div
          role="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none fixed inset-0 z-[60] flex bg-background/85 p-3 backdrop-blur-sm sm:p-6"
        >
          <div className="relative flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl bg-primary/5 px-6 text-center">
            <svg aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
              <rect
                x="2"
                y="2"
                rx="24"
                style={{ width: "calc(100% - 4px)", height: "calc(100% - 4px)" }}
                fill="none"
                strokeWidth="4"
                className="dash-march stroke-primary/60"
              />
            </svg>
            <m.div
              initial={{ scale: 0.6, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
            >
              <Mascot mood="working" className="w-36 sm:w-44" />
            </m.div>
            <p className="font-heading text-2xl font-bold sm:text-4xl">{title}</p>
            <p className="max-w-md text-muted-foreground sm:text-lg">{description}</p>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
