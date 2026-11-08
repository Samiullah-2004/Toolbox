"use client"

import { useRouter } from "next/navigation"
import { Play } from "lucide-react"
import type { Chain } from "@/lib/jugaad"
import { startChain } from "@/lib/jugaad-store"

/** Starts a Jugaad chain and opens its first tool */
export function StartChainButton({ chain }: { chain: Chain }) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => {
        startChain(chain.id)
        router.push(`/tools/${chain.steps[0]}`)
      }}
      className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.86_0.15_88)] px-3 py-1.5 text-xs font-semibold text-[#1e2433] outline-none transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-white/60 active:scale-95"
    >
      <Play className="size-3.5" aria-hidden="true" />
      Start
    </button>
  )
}
