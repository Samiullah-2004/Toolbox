"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { m } from "motion/react"
import { Info, LayoutGrid, ShieldCheck, type LucideIcon } from "lucide-react"
import { cn } from "cn"
import { categoryStyles } from "@/lib/category-styles"
import { icons } from "@/lib/icons"
import { categories, getTool, type CategoryId } from "@/lib/tools"

type Section = CategoryId | "all" | "about" | "privacy"

const items: {
  id: Section
  href: string
  label: string
  icon: LucideIcon
  iconClass?: string
  bar: string
  /** extra classes on the <li>, e.g. to hide a link where the bar is too narrow */
  itemClass?: string
}[] = [
  ...categories.map((c) => ({
    id: c.id,
    href: `/category/${c.id}`,
    label: c.shortName,
    icon: icons[c.icon],
    iconClass: categoryStyles[c.id].text,
    bar: categoryStyles[c.id].bar,
  })),
  { id: "all", href: "/tools", label: "All tools", icon: LayoutGrid, bar: "bg-foreground", itemClass: "ml-1 border-l pl-1.5" },
  { id: "about", href: "/about", label: "About", icon: Info, bar: "bg-foreground" },
  // Privacy also lives in the footer and on the About page; it joins the bar where there is room
  { id: "privacy", href: "/privacy", label: "Privacy", icon: ShieldCheck, bar: "bg-foreground", itemClass: "hidden 2xl:block" },
]

/** Which navbar item a path belongs to: a category page or one of its tools lights up that category */
function activeSection(pathname: string): Section | null {
  const [, section, name] = pathname.split("/")
  if (section === "category") return (name as CategoryId) ?? null
  if (section === "tools") return name ? (getTool(name)?.category ?? null) : "all"
  if (section === "about" || section === "privacy") return section
  return null
}

function NavLinks({ active }: { active: Section | null }) {
  // The soft highlight slides to whichever link the mouse is over
  const [hovered, setHovered] = useState<Section | null>(null)

  return (
    <ul className="flex items-center gap-0.5" onMouseLeave={() => setHovered(null)}>
      {items.map((item) => {
        const isActive = active === item.id
        const Icon = item.icon
        return (
          <li key={item.id} className={item.itemClass}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onMouseEnter={() => setHovered(item.id)}
              onFocus={() => setHovered(item.id)}
              onBlur={() => setHovered(null)}
              className={cn(
                "group relative isolate flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40",
                isActive && "text-foreground"
              )}
            >
              {hovered === item.id && (
                <m.span
                  layoutId="nav-hover"
                  className="absolute inset-0 -z-10 rounded-lg bg-muted"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <Icon
                className={cn("size-4 transition-transform duration-200 group-hover:-rotate-8 group-hover:scale-110", item.iconClass)}
                aria-hidden="true"
              />
              {item.label}
              {isActive && (
                <m.span
                  layoutId="nav-active"
                  className={cn("absolute inset-x-2.5 -bottom-[13px] h-0.5 rounded-full", item.bar)}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function ActiveNavLinks() {
  return <NavLinks active={activeSection(usePathname())} />
}

export function MainNav() {
  return (
    <nav aria-label="Tool categories">
      {/* The links render right away; the highlight appears once the current page is known */}
      <Suspense fallback={<NavLinks active={null} />}>
        <ActiveNavLinks />
      </Suspense>
    </nav>
  )
}
