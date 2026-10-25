"use client"

import { useSyncExternalStore } from "react"
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
