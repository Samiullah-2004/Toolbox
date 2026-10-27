"use client"

import { useEffect, type RefObject } from "react"
import { useReducedMotion } from "motion/react"

/**
 * Makes the mascot's pupils follow the mouse. It writes two CSS variables on the SVG
 * once per animation frame, so React never re-renders while the mouse moves.
 * Skipped on touch screens and when the user prefers reduced motion.
 */
export function useEyeTracking(ref: RefObject<SVGSVGElement | null>, maxOffset = 5) {
  const reduced = useReducedMotion()

  useEffect(() => {
    const svg = ref.current
    if (!svg) return
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    if (!finePointer || reduced) {
      // back to the resting look
      svg.style.removeProperty("--look-x")
      svg.style.removeProperty("--look-y")
      return
    }

    let frame = 0
    let pointer = { x: 0, y: 0 }

    const update = () => {
      frame = 0
      const box = svg.getBoundingClientRect()
      if (box.width === 0) return
      // eyes sit a little above the middle of the drawing
      const dx = pointer.x - (box.left + box.width * 0.45)
      const dy = pointer.y - (box.top + box.height * 0.58)
      const distance = Math.hypot(dx, dy)
      const pull = Math.min(distance / 160, 1) * maxOffset
      const x = distance ? (dx / distance) * pull : 0
      const y = distance ? (dy / distance) * pull : 0
      svg.style.setProperty("--look-x", `${x.toFixed(2)}px`)
      svg.style.setProperty("--look-y", `${y.toFixed(2)}px`)
    }

    const onMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY }
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(frame)
    }
  }, [ref, maxOffset, reduced])
}
