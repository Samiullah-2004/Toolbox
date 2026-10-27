"use client"

import { useSyncExternalStore } from "react"

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true })
  return () => window.removeEventListener("scroll", onChange)
}

/** True once the page is scrolled further than `threshold` pixels. Re-renders only when that flips. */
export function useScrolledPast(threshold: number) {
  return useSyncExternalStore(
    subscribe,
    () => window.scrollY > threshold,
    () => false
  )
}
