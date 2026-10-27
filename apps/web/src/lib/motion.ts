// Shared motion helpers, so timing and presets stay the same everywhere.

/** Inline style that staggers the CSS `rise` entrance: <p className="rise" style={riseDelay(120)}> */
export const riseDelay = (ms: number) => ({ "--delay": `${ms}ms` }) as React.CSSProperties

/** Enter/exit preset for swapping one block for another (e.g. empty drop zone -> file list) */
export const swapPreset = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
} as const

/**
 * For code outside React components (event handlers, plain functions).
 * Inside components use Motion's useReducedMotion(), which also reacts to setting changes.
 */
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
