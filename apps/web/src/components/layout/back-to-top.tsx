"use client"

import { AnimatePresence, m } from "motion/react"
import { ArrowUp } from "lucide-react"
import { useScrolledPast } from "@/hooks/use-scrolled-past"

/** Appears after the user has scrolled down a long page */
export function BackToTop() {
  const visible = useScrolledPast(900)

  return (
    <AnimatePresence>
      {visible && (
        <m.button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, y: 16, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.8 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.9 }}
          className="fixed right-4 bottom-4 z-40 flex size-11 items-center justify-center rounded-full border bg-card text-foreground shadow-lg shadow-foreground/10 sm:right-6 sm:bottom-6"
        >
          <ArrowUp className="size-5" aria-hidden="true" />
        </m.button>
      )}
    </AnimatePresence>
  )
}
