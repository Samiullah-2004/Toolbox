"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, LayoutGroup, m } from "motion/react"
import { CloudUpload, Lock, Search, X } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { LiveMascot } from "@/components/brand/live-mascot"
import { ToolCard } from "@/components/tools/tool-card"
import { ToolIcon } from "@/components/tools/tool-icon"
import { categoryStyles } from "@/lib/category-styles"
import { categories, searchTools, tools, type CategoryId, type RunsOn } from "@/lib/tools"

type Where = "all" | RunsOn

const whereOptions: { value: Where; label: string; icon?: typeof Lock }[] = [
  { value: "all", label: "All" },
  { value: "browser", label: "On device", icon: Lock },
  { value: "server", label: "Server", icon: CloudUpload },
]

export function ToolExplorer() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<CategoryId | "all">("all")
  const [where, setWhere] = useState<Where>("all")

  const results = useMemo(
    () =>
      searchTools(query).filter(
        (t) => (category === "all" || t.category === category) && (where === "all" || t.runsOn === where)
      ),
    [query, category, where]
  )

  const grouped = !query.trim() && category === "all"
  const reset = () => {
    setQuery("")
    setCategory("all")
    setWhere("all")
  }

  return (
    <>
      {/* sits right under the 69px sticky header */}
      <div className="sticky top-[69px] z-30 border-b bg-background/90 backdrop-blur-lg">
        <div className="container-page flex flex-col gap-3 py-3 md:flex-row md:items-center">
          <div className="relative shrink-0 md:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools, e.g. mp3"
              aria-label="Search tools"
              className="h-11 w-full rounded-xl border bg-card pr-10 pl-10 text-base outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15 md:text-sm [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filter by category"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar scroll-fade-x sm:-mx-6 sm:px-6 md:mx-0 md:flex-1 md:px-0 lg:flex-wrap lg:overflow-visible lg:[mask-image:none]"
          >
            {[{ id: "all" as const, name: "All tools" }, ...categories].map((c) => {
              const count = c.id === "all" ? tools.length : tools.filter((t) => t.category === c.id).length
              const active = category === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "relative isolate flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 active:scale-95",
                    active
                      ? "border-foreground text-background"
                      : "bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {active && (
                    <m.span
                      layoutId="chip-active"
                      className="absolute -inset-px -z-10 rounded-full bg-foreground"
                      transition={{ type: "spring", stiffness: 480, damping: 36 }}
                    />
                  )}
                  {c.id !== "all" && (
                    <span className={cn("size-2 rounded-full", categoryStyles[c.id].bar)} aria-hidden="true" />
                  )}
                  {c.name}
                  <span className={cn("text-xs tabular-nums", active ? "opacity-70" : "opacity-60")}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="container-page py-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="sr-only" aria-live="polite">
              Showing {results.length} {results.length === 1 ? "tool" : "tools"}
            </span>
            <span aria-hidden="true">
            Showing{" "}
            <span className="relative inline-flex overflow-hidden align-bottom font-semibold text-foreground tabular-nums">
              <AnimatePresence mode="popLayout" initial={false}>
                <m.span
                  key={results.length}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {results.length}
                </m.span>
              </AnimatePresence>
            </span>{" "}
            {results.length === 1 ? "tool" : "tools"}
            </span>
          </p>
          <div role="radiogroup" aria-label="Where the tool runs" className="flex gap-1 rounded-xl bg-muted p-1">
            {whereOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={where === value}
                onClick={() => setWhere(value)}
                className={cn(
                  "relative isolate flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  where === value && "text-foreground"
                )}
              >
                {where === value && (
                  <m.span
                    layoutId="where-thumb"
                    className="absolute inset-0 -z-10 rounded-lg bg-background shadow-sm"
                    transition={{ type: "spring", stiffness: 480, damping: 36 }}
                  />
                )}
                {Icon && <Icon className="size-3.5" aria-hidden="true" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {results.length === 0 ? (
          <m.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center rounded-3xl border border-dashed px-6 py-14 text-center"
          >
            <LiveMascot mood="oops" className="w-36" />
            <p className="mt-4 font-heading text-xl font-bold">
              {query ? <>No tool matches &ldquo;{query}&rdquo;</> : "No tools match these filters"}
            </p>
            <p className="mt-1 text-muted-foreground">Try a simpler word like &ldquo;pdf&rdquo;, &ldquo;video&rdquo; or &ldquo;photo&rdquo;.</p>
            <Button variant="outline" className="mt-5" onClick={reset}>
              Clear search and filters
            </Button>
          </m.div>
        ) : grouped ? (
          <div className="space-y-14">
            {categories.map((c) => {
              const list = results.filter((t) => t.category === c.id)
              if (!list.length) return null
              return (
                <section
                  key={c.id}
                  id={c.id}
                  aria-labelledby={`${c.id}-heading`}
                  className="scroll-mt-52 md:scroll-mt-40"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <ToolIcon icon={c.icon} category={c.id} />
                    <div>
                      <h2 id={`${c.id}-heading`} className="text-2xl font-bold">
                        {c.name}{" "}
                        <span className={cn("ml-1 text-base font-semibold", categoryStyles[c.id].text)}>
                          {c.localName}
                        </span>
                      </h2>
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                    </div>
                  </div>
                  <ToolGrid tools={list} />
                </section>
              )
            })}
          </div>
        ) : (
          <ToolGrid tools={results} />
        )}
      </div>
    </>
  )
}

/** Cards fade out when filtered away, and the rest glide to their new places */
function ToolGrid({ tools }: { tools: ReturnType<typeof searchTools> }) {
  return (
    <LayoutGroup>
      {/* popLayout positions leaving cards absolutely, so the list must be `relative` */}
      <ul className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {tools.map((tool) => (
            <m.li
              key={tool.slug}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <ToolCard tool={tool} />
            </m.li>
          ))}
        </AnimatePresence>
      </ul>
    </LayoutGroup>
  )
}
