"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Command as CommandPrimitive } from "cmdk"
import { AnimatePresence, m, useReducedMotion } from "motion/react"
import { Search, X } from "lucide-react"
import { CommandEmpty, CommandItem } from "@/components/ui/command"
import { PrivacyDot } from "@/components/tools/privacy-badge"
import { ToolIcon } from "@/components/tools/tool-icon"
import { commandFilter, searchKeywords, tools } from "@/lib/tools"

// Popular tools first, so an empty search shows the most useful ones on top
const ordered = [...tools].sort((a, b) => Number(!!b.popular) - Number(!!a.popular))

const examples = ["compress PDF", "video to MP3", "HEIC to JPG", "passport photo", "merge PDF", "Urdu OCR"]

/** Cycles through real example searches so new users see what they can type */
function ExamplePlaceholder() {
  const [index, setIndex] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % examples.length), 2600)
    return () => clearInterval(timer)
  }, [reduced])

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center overflow-hidden text-base whitespace-nowrap text-muted-foreground sm:text-lg"
    >
      <span className="hidden sm:inline">What do you want to do?&nbsp;</span>
      Try&nbsp;
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={examples[index]}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="font-medium text-foreground/70"
        >
          &ldquo;{examples[index]}&rdquo;
        </m.span>
      </AnimatePresence>
    </span>
  )
}

export function HeroSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  return (
    <CommandPrimitive
      filter={commandFilter}
      loop
      label="Search tools"
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false)
          inputRef.current?.blur()
        }
      }}
    >
      <div className="flex h-14 items-center gap-3 rounded-2xl border bg-card px-4 shadow-lg shadow-foreground/[0.04] transition focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/15 sm:h-16 sm:px-5">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="relative h-full min-w-0 flex-1">
          <CommandPrimitive.Input
            ref={inputRef}
            value={query}
            onValueChange={(value) => {
              setQuery(value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            aria-label="Search tools, for example compress PDF"
            className="size-full bg-transparent text-base outline-none sm:text-lg"
          />
          {!query && <ExamplePlaceholder />}
        </div>
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery("")
              inputRef.current?.focus()
            }}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {open && (
        <CommandPrimitive.List
          // Keep focus in the input so a click on a result is not lost to blur
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-[min(24rem,55vh)] scroll-py-1.5 overflow-y-auto rounded-2xl border bg-popover p-1.5 text-popover-foreground shadow-2xl shadow-foreground/10 duration-150 animate-in fade-in-0 slide-in-from-top-1"
        >
          <CommandEmpty className="px-4 py-8 text-center text-sm text-muted-foreground">
            No tool found for &ldquo;{query}&rdquo;. Try &ldquo;pdf&rdquo;, &ldquo;mp3&rdquo; or &ldquo;photo&rdquo;.
          </CommandEmpty>
          {ordered.map((tool) => (
            <CommandItem
              key={tool.slug}
              value={tool.name}
              keywords={searchKeywords(tool)}
              onSelect={() => router.push(`/tools/${tool.slug}`)}
              className="gap-3 rounded-xl! px-2.5 py-2"
            >
              <ToolIcon icon={tool.icon} category={tool.category} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{tool.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{tool.description}</span>
              </span>
              <PrivacyDot runsOn={tool.runsOn} />
            </CommandItem>
          ))}
        </CommandPrimitive.List>
      )}
    </CommandPrimitive>
  )
}
