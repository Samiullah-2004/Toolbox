import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "cn"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { PrivacyDot } from "@/components/tools/privacy-badge"
import { categoryStyles } from "@/lib/category-styles"
import { icons } from "@/lib/icons"
import { categories, tools, toolsInCategory } from "@/lib/tools"

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#jugaad", label: "Jugaad Mode" },
  { href: "/privacy", label: "Privacy" },
]

export function MainNav() {
  return (
    <NavigationMenu viewport={false} aria-label="Main">
      <NavigationMenuList className="gap-0.5">
        <NavigationMenuItem>
          <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
          <NavigationMenuContent className="w-[46rem] p-0! xl:w-[52rem]">
            <div className="columns-3 gap-6 p-5">
              {categories.map((category) => (
                <div key={category.id} className="mb-5 break-inside-avoid last:mb-0">
                  <p className="mb-1.5 flex items-center gap-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <span className={cn("size-2 rounded-full", categoryStyles[category.id].bar)} />
                    {category.name}
                  </p>
                  <ul>
                    {toolsInCategory(category.id).map((tool) => {
                      const Icon = icons[tool.icon]
                      return (
                        <li key={tool.slug}>
                          <NavigationMenuLink asChild>
                            <Link href={`/tools/${tool.slug}`} className="py-1.5">
                              <Icon className={categoryStyles[tool.category].text} />
                              <span className="flex-1 truncate">{tool.name}</span>
                              <PrivacyDot runsOn={tool.runsOn} />
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-4 border-t bg-muted/50 px-5 py-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <PrivacyDot runsOn="browser" /> Stays on your device
                </span>
                <span className="flex items-center gap-1.5">
                  <PrivacyDot runsOn="server" /> Uploaded, deleted after 1 hour
                </span>
              </div>
              <NavigationMenuLink asChild>
                <Link href="/tools" className="font-medium text-foreground">
                  Browse all {tools.length} tools <ArrowRight />
                </Link>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        {links.map((link) => (
          <NavigationMenuItem key={link.href}>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href={link.href}>{link.label}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
