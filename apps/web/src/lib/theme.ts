"use client"

import { useSyncExternalStore } from "react"
import { prefersReducedMotion } from "@/lib/motion"
import { THEME_STORAGE_KEY } from "@/lib/theme-script"

export type Theme = "light" | "dark" | "system"

const listeners = new Set<() => void>()
const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)")

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
  } catch {}
  return "system"
}

function resolve(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme
  return darkQuery().matches ? "dark" : "light"
}

function apply(theme: Theme) {
  const resolved = resolve(theme)
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved
}

export function setTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {}
  apply(theme)
  listeners.forEach((l) => l())
}

/**
 * Switches theme with a circular reveal that grows from `origin` (the button the user pressed).
 * Uses the View Transitions API where available; elsewhere, or with reduced motion, it switches instantly.
 */
export function switchTheme(theme: Theme, origin?: HTMLElement | null) {
  const changes = resolve(theme) !== resolve(readTheme())
  if (!changes || prefersReducedMotion() || !document.startViewTransition || !origin) {
    setTheme(theme)
    return
  }
  const box = origin.getBoundingClientRect()
  const x = box.left + box.width / 2
  const y = box.top + box.height / 2
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  const root = document.documentElement
  root.style.setProperty("--vt-x", `${x}px`)
  root.style.setProperty("--vt-y", `${y}px`)
  root.style.setProperty("--vt-r", `${radius}px`)
  // The circle reveal CSS only applies while this class is set, so other view transitions are unaffected
  root.classList.add("theme-switching")
  const transition = document.startViewTransition(() => setTheme(theme))
  transition.finished.finally(() => root.classList.remove("theme-switching"))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const query = darkQuery()
  const onSystemChange = () => {
    if (readTheme() === "system") apply("system")
    listener()
  }
  // A theme change in another tab
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_STORAGE_KEY && e.key !== null) return
    apply(readTheme())
    listener()
  }
  query.addEventListener("change", onSystemChange)
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    query.removeEventListener("change", onSystemChange)
    window.removeEventListener("storage", onStorage)
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme)
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    () => resolve(readTheme()),
    () => "light" as const
  )
  return { theme, resolvedTheme, setTheme }
}
