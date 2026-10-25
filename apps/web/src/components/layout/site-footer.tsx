import Link from "next/link"
import { Coffee } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { TruckBorder } from "@/components/brand/truck-border"
import { categories, popularTools } from "@/lib/tools"

export const GITHUB_URL = "https://github.com/Samiullah-2004/Toolbox"

const columns = [
  {
    title: "Popular tools",
    links: popularTools.slice(0, 6).map((t) => ({ href: `/tools/${t.slug}`, label: t.name })),
  },
  {
    title: "Categories",
    links: categories.map((c) => ({ href: `/category/${c.id}`, label: c.name })),
  },
  {
    title: "Toolbox",
    links: [
      { href: "/tools", label: "All tools" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#jugaad", label: "Jugaad Mode" },
      { href: "/privacy", label: "Privacy" },
      { href: GITHUB_URL, label: "Source code on GitHub" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/40">
      <TruckBorder id="footer" />
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)] lg:py-14">
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="font-heading text-lg font-semibold">Har kaam ka tool, ek hi box mein.</p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Free PDF, video, audio and image tools. Most of them run in your browser, so your files stay with
            you.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="mb-3 font-sans text-sm font-semibold tracking-normal">{column.title}</h2>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    {...(link.href.startsWith("http") && { target: "_blank", rel: "noreferrer" })}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Toolbox. A university project by Sami.</p>
          <p className="flex items-center gap-1.5">
            Made with <Coffee className="size-3.5" aria-label="chai" /> in Pakistan
          </p>
        </div>
      </div>
    </footer>
  )
}
