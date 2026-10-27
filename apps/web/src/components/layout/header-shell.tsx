"use client"

import { cn } from "cn"
import { useScrolledPast } from "@/hooks/use-scrolled-past"

/** The sticky header. Once the page is scrolled it gains a shadow, so the user knows they are not at the top. */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const scrolled = useScrolledPast(8)
  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg transition-[box-shadow,background-color] duration-300",
        "data-scrolled:bg-background/90 data-scrolled:shadow-[0_8px_30px_-12px] data-scrolled:shadow-foreground/15"
      )}
    >
      {children}
    </header>
  )
}
