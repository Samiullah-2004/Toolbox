"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Logo } from "@/components/brand/logo"
import { ThemeSegmented } from "@/components/layout/theme-toggle"
import { ToolIcon } from "@/components/tools/tool-icon"
import { riseDelay } from "@/lib/motion"
import { categories, tools, toolsInCategory } from "@/lib/tools"

const links = [
  { href: "/tools", label: `All ${tools.length} tools` },
  { href: "/about", label: "About Toolbox" },
  { href: "/privacy", label: "Privacy" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88vw] gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b p-4">
          <SheetTitle asChild>
            <div onClick={() => setOpen(false)}>
              <Logo />
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">Tool categories and site pages</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 overflow-y-auto p-4">
          <div>
            <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Tool categories
            </p>
            <div className="grid gap-1">
              {categories.map((category, i) => (
                <SheetClose asChild key={category.id}>
                  <Link
                    href={`/category/${category.id}`}
                    style={riseDelay(60 + i * 40)}
                    className="rise group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-[background-color,scale] duration-150 hover:bg-muted active:scale-[0.98] active:bg-muted"
                  >
                    <ToolIcon
                      icon={category.icon}
                      category={category.id}
                      size="sm"
                      className="transition-transform duration-300 group-hover:-rotate-6 group-active:scale-90"
                    />
                    <span className="flex-1 font-medium">{category.name}</span>
                    <span className="text-xs text-muted-foreground">{toolsInCategory(category.id).length}</span>
                  </Link>
                </SheetClose>
              ))}
            </div>
          </div>

          <nav aria-label="Pages" className="grid gap-1 border-t pt-5">
            {links.map((link, i) => (
              <SheetClose asChild key={link.href}>
                <Link
                  href={link.href}
                  style={riseDelay(300 + i * 40)}
                  className="rise group flex items-center justify-between rounded-xl px-3 py-3 text-base font-medium transition-[background-color,scale] duration-150 hover:bg-muted active:scale-[0.98] active:bg-muted"
                >
                  {link.label}
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              </SheetClose>
            ))}
          </nav>

          <div>
            <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Theme</p>
            <ThemeSegmented />
          </div>
        </div>

        <p className="border-t p-4 text-center text-sm text-muted-foreground">
          Free to use. No sign-up, no login.
        </p>
      </SheetContent>
    </Sheet>
  )
}
