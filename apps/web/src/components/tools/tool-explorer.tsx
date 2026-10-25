"use client"

import { useMemo, useState } from "react"
import { CloudUpload, Lock, Search, X } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Mascot } from "@/components/brand/mascot"
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
          <div className="relative md:w-72 lg:w-80">
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
            className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:-mx-6 sm:px-6 md:mx-0 md:flex-1 md:px-0"
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
                    "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
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
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing <span className="font-semibold text-foreground">{results.length}</span>{" "}
            {results.length === 1 ? "tool" : "tools"}
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
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition",
                  where === value && "bg-background text-foreground shadow-sm"
                )}
              >
                {Icon && <Icon className="size-3.5" aria-hidden="true" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed px-6 py-14 text-center">
            <Mascot mood="oops" className="w-36" />
            <p className="mt-4 font-heading text-xl font-bold">
              {query ? <>No tool matches &ldquo;{query}&rdquo;</> : "No tools match these filters"}
            </p>
            <p className="mt-1 text-muted-foreground">Try a simpler word like &ldquo;pdf&rdquo;, &ldquo;video&rdquo; or &ldquo;photo&rdquo;.</p>
            <Button variant="outline" className="mt-5" onClick={reset}>
              Clear search and filters
            </Button>
          </div>
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

function ToolGrid({ tools }: { tools: ReturnType<typeof searchTools> }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tools.map((tool) => (
        <li key={tool.slug}>
          <ToolCard tool={tool} />
        </li>
      ))}
    </ul>
  )
}
