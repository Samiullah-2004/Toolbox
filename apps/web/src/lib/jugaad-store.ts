"use client"

// The Jugaad chain in progress, shared by the chain bar and the result panel.

import { useSyncExternalStore } from "react"
import { chains } from "@/lib/jugaad"

const KEY = "toolbox:jugaad"
let active: string | null = null
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === "undefined") return
  loaded = true
  // kept for this tab only, so a page reload doesn't lose your place
  try {
    active = sessionStorage.getItem(KEY)
  } catch {
    active = null
  }
}

function save(id: string | null) {
  active = id
  try {
    if (id) sessionStorage.setItem(KEY, id)
    else sessionStorage.removeItem(KEY)
  } catch {
    // private windows may block storage; the chain then lasts until the tab is reloaded
  }
  listeners.forEach((listener) => listener())
}

export const startChain = (id: string) => save(id)
export const leaveChain = () => save(null)

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The chain in progress, and this tool's place in it (or null when this tool isn't part of it) */
export function useChainStep(slug: string) {
  const id = useSyncExternalStore(
    subscribe,
    () => {
      load()
      return active
    },
    () => null
  )
  const chain = chains.find((c) => c.id === id)
  if (!chain) return null
  const index = chain.steps.indexOf(slug)
  if (index < 0) return null
  return { chain, index, next: chain.steps[index + 1] ?? null, last: index === chain.steps.length - 1 }
}
