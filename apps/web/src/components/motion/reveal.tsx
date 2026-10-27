"use client"

import { Children, cloneElement, isValidElement, useLayoutEffect, useRef } from "react"
import { cn } from "cn"

/**
 * Marks an element visible (`data-visible`) the first time it scrolls into view; CSS in
 * globals.css does the actual fade-and-rise. Content that is already on screen when the page
 * loads is shown immediately, before paint, so nothing flickers or waits.
 *
 * Content is only hidden once MotionProvider adds `motion-ready` to <html>, so it stays
 * visible if JavaScript is slow, fails or is turned off.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const show = () => el.setAttribute("data-visible", "")
    const box = el.getBoundingClientRect()
    if (box.top < window.innerHeight && box.bottom > 0) {
      show()
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show()
          observer.disconnect()
        }
      },
      // The huge top margin counts everything above the screen as seen, so content the user
      // jumped past (e.g. landing on /about#faq) is already there when they scroll back up.
      { rootMargin: "100000px 0px -60px 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

/** Fades and lifts its content in the first time it scrolls into view */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  /** milliseconds */
  delay?: number
}) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={cn("reveal", className)} style={{ "--delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </div>
  )
}

/** A line that grows from left to right the first time it scrolls into view */
export function GrowLine({ className }: { className?: string }) {
  const ref = useReveal<HTMLDivElement>()
  return <div ref={ref} aria-hidden="true" className={cn("reveal-line", className)} />
}

/**
 * Reveals its <StaggerItem> children one after another.
 * Keep hover effects on an element inside each item, not on the item itself,
 * so the reveal and the hover never fight over the same transform.
 */
export function Stagger({
  children,
  className,
  as: Component = "div",
  gap = 70,
}: {
  children: React.ReactNode
  className?: string
  as?: "div" | "ul" | "ol"
  /** milliseconds between items */
  gap?: number
}) {
  const ref = useReveal<HTMLElement>()
  let index = 0
  return (
    <Component ref={ref as React.Ref<never>} data-stagger="" className={className}>
      {Children.map(children, (child) =>
        isValidElement<{ index?: number; gap?: number }>(child) ? cloneElement(child, { index: index++, gap }) : child
      )}
    </Component>
  )
}

export function StaggerItem({
  children,
  className,
  as: Component = "div",
  index = 0,
  gap = 70,
}: {
  children: React.ReactNode
  className?: string
  as?: "div" | "li"
  /** set by <Stagger> */
  index?: number
  gap?: number
}) {
  return (
    <Component
      className={cn("reveal-item", className)}
      style={{ "--delay": `${index * gap}ms` } as React.CSSProperties}
    >
      {children}
    </Component>
  )
}
