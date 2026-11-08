import { useCallback } from "react"
import { prefersReducedMotion } from "@/lib/motion"

/** Height of the sticky site header, plus a little room */
const HEADER_ROOM = 88

/**
 * Ref callback for a panel that replaces a taller one (progress, results). If the person had scrolled
 * down to press a button, the new, shorter panel can end up above the screen; this brings its top
 * back into view, just below the sticky header. It does nothing when the panel is already visible.
 */
export function useBringIntoView<T extends HTMLElement>() {
  return useCallback((element: T | null) => {
    // hidden pages (kept alive by Next.js) must not move the page you are looking at
    if (!element || !element.checkVisibility()) return
    const top = element.getBoundingClientRect().top
    if (top >= HEADER_ROOM - 16) return
    window.scrollBy({ top: top - HEADER_ROOM, behavior: prefersReducedMotion() ? "auto" : "smooth" })
  }, [])
}
