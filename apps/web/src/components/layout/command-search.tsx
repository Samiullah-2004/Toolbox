"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { PrivacyDot } from "@/components/tools/privacy-badge"
import { ToolIcon } from "@/components/tools/tool-icon"
import { categories, commandFilter, searchKeywords, tools, toolsInCategory, type Tool } from "@/lib/tools"

const noop = () => () => {}

function useModifierKey() {
  return useSyncExternalStore(
    noop,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl"),
    () => "Ctrl"
  )
}

export function CommandSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()
  const modifier = useModifierKey()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // key can be missing on autofill and some IME events
      if (typeof e.key !== "string") return
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }
      // "/" opens search too, unless the user is typing somewhere
      const target = e.target as HTMLElement
      const typing = target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const go = (slug: string) => {
    setOpen(false)
    setQuery("")
    router.push(`/tools/${slug}`)
  }

  const renderItem = (tool: Tool) => (
    <CommandItem
      key={tool.slug}
      value={tool.name}
      keywords={searchKeywords(tool)}
      onSelect={() => go(tool.slug)}
      className="gap-3 py-2"
    >
      <ToolIcon icon={tool.icon} category={tool.category} size="sm" />
      <span className="flex-1 truncate font-medium">{tool.name}</span>
      <PrivacyDot runsOn={tool.runsOn} />
    </CommandItem>
  )

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        // full button on tablets and wide screens; an icon on laptops, where the category links need the room
        className="hidden w-52 justify-start font-normal text-muted-foreground md:inline-flex lg:hidden xl:inline-flex xl:w-56"
      >
        <Search />
        Search tools...
        <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] font-medium">
          {modifier} K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden lg:inline-flex xl:hidden"
        aria-label="Search tools"
      >
        <Search />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search tools"
        description="Find a tool by its name or by what you want to do"
        className="sm:max-w-xl"
      >
        <Command filter={commandFilter}>
          <CommandInput
            placeholder="What do you want to do? e.g. compress PDF"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[min(60vh,28rem)]">
            <CommandEmpty>No tool found. Try &ldquo;pdf&rdquo;, &ldquo;mp3&rdquo; or &ldquo;photo&rdquo;.</CommandEmpty>
            {query.trim() ? (
              // While searching, one list ranked by best match across all categories
              <CommandGroup heading="Results">{tools.map(renderItem)}</CommandGroup>
            ) : (
              categories.map((category) => (
                <CommandGroup key={category.id} heading={category.name}>
                  {toolsInCategory(category.id).map(renderItem)}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
