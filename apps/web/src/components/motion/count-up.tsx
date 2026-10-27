"use client"

import { useEffect, useRef } from "react"
import { animate, useInView, useReducedMotion } from "motion/react"

/** Counts from 0 to `to` the first time it scrolls into view */
export function CountUp({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" })
  const reduced = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!inView || !node || reduced) return
    const controls = animate(0, to, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => {
        node.textContent = String(Math.round(value))
      },
    })
    return () => controls.stop()
  }, [inView, to, reduced])

  // The real number is in the HTML, so it is correct without JavaScript and for screen readers
  return (
    <span ref={ref} className={className}>
      {to}
    </span>
  )
}
