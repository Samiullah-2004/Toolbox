"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "motion/react"
import { Clapperboard, FileText, Image, Mic, Music2, QrCode, Scissors, Wrench } from "lucide-react"
import { cn } from "cn"

// Hand-placed doodles around the hero edges. depth = how far each one drifts with the mouse.
const doodles = [
  { Icon: FileText, place: "top-[12%] left-[3%]", look: "-rotate-12 text-cat-pdf", depth: 18, delay: "0s" },
  { Icon: Scissors, place: "top-[58%] left-[1.5%]", look: "rotate-[18deg] text-cat-pdf", depth: 28, delay: "1.2s" },
  { Icon: Clapperboard, place: "top-[6%] left-[44%]", look: "rotate-[8deg] text-cat-video", depth: 12, delay: "0.6s" },
  { Icon: Music2, place: "top-[44%] left-[47%]", look: "-rotate-8 text-cat-audio", depth: 22, delay: "2s" },
  { Icon: Image, place: "top-[8%] right-[4%]", look: "rotate-[10deg] text-cat-image", depth: 16, delay: "1.6s" },
  { Icon: Mic, place: "top-[46%] right-[1.5%]", look: "-rotate-[14deg] text-cat-speech", depth: 26, delay: "0.3s" },
  { Icon: QrCode, place: "top-[3%] right-[24%]", look: "rotate-6 text-cat-utility", depth: 20, delay: "2.4s" },
  { Icon: Wrench, place: "bottom-[16%] left-[22%]", look: "rotate-[24deg] text-teal", depth: 14, delay: "0.9s" },
]

/**
 * Background doodles of the things Toolbox works with. They float slowly and drift a
 * little with the mouse (parallax), which makes the page feel alive without getting in the way.
 * Hidden on small screens, where space is better spent on content.
 */
export function HeroDoodles() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const layer = ref.current
    if (!layer) return
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    if (!canHover || reduced) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        // -0.5 .. 0.5 across the window
        layer.style.setProperty("--px", (e.clientX / window.innerWidth - 0.5).toFixed(3))
        layer.style.setProperty("--py", (e.clientY / window.innerHeight - 0.5).toFixed(3))
      })
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(frame)
    }
  }, [reduced])

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
      {doodles.map(({ Icon, place, look, depth, delay }, i) => (
        // outer: position + mouse parallax; middle: slow float; inner: fixed tilt and color
        <span
          key={i}
          className={cn("absolute transition-transform duration-700 ease-out", place)}
          style={{
            transform: `translate(calc(var(--px, 0) * ${depth}px * -1), calc(var(--py, 0) * ${depth}px * -1))`,
          }}
        >
          <span className="block animate-float" style={{ animationDelay: delay }}>
            <Icon className={cn("size-8 opacity-25 dark:opacity-30", look)} strokeWidth={1.5} />
          </span>
        </span>
      ))}
    </div>
  )
}
