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
import { SignInButton } from "@/components/layout/sign-in-button"
import { ThemeSegmented } from "@/components/layout/theme-toggle"
import { ToolIcon } from "@/components/tools/tool-icon"
import { categories, tools, toolsInCategory } from "@/lib/tools"

const links = [
  { href: "/tools", label: `All ${tools.length} tools` },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#jugaad", label: "Jugaad Mode" },
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
          <SheetDescription className="sr-only">Site navigation and tool categories</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 overflow-y-auto p-4">
          <nav aria-label="Mobile" className="grid gap-1">
            {links.map((link) => (
              <SheetClose asChild key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-base font-medium hover:bg-muted"
                >
                  {link.label}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </SheetClose>
            ))}
          </nav>

          <div>
            <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Tool categories
            </p>
            <div className="grid gap-1">
              {categories.map((category) => (
                <SheetClose asChild key={category.id}>
                  <Link
                    href={`/category/${category.id}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted"
                  >
                    <ToolIcon icon={category.icon} category={category.id} size="sm" />
                    <span className="flex-1 font-medium">{category.name}</span>
                    <span className="text-xs text-muted-foreground">{toolsInCategory(category.id).length}</span>
                  </Link>
                </SheetClose>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Theme</p>
            <ThemeSegmented />
          </div>
        </div>

        <div className="border-t p-4">
          <SignInButton className="h-11 w-full" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
