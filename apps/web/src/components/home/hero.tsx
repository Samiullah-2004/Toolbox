import Link from "next/link"
import { Gift, Lock, Smartphone, Sparkles, Zap } from "lucide-react"
import { HeroSearch } from "@/components/home/hero-search"
import { SmartDrop } from "@/components/home/smart-drop"
import { ToolIcon } from "@/components/tools/tool-icon"
import { getTool } from "@/lib/tools"

const quickPicks = ["compress-pdf", "merge-pdf", "heic-to-jpg", "video-to-mp3", "whatsapp-voice-note", "passport-photo"]

const promises = [
  { icon: Gift, title: "100% free", text: "No watermark, no hidden fees" },
  { icon: Lock, title: "Private by design", text: "Most tools never upload files" },
  { icon: Zap, title: "No sign-up", text: "Open a tool and start" },
  { icon: Smartphone, title: "Any device", text: "Phone, tablet or laptop" },
]

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* background: paper dots + warm and teal glows */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 dot-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -top-40 -left-32 -z-10 size-[34rem] rounded-full bg-brand/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute top-20 -right-40 -z-10 size-[30rem] rounded-full bg-teal/12 blur-3xl"
      />

      <div className="container-page grid items-center gap-10 pt-10 pb-12 sm:pt-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14 lg:pt-20 lg:pb-16">
        <div className="relative z-20">
          <p className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3.5 py-1.5 text-sm font-medium shadow-sm">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            Har kaam ka tool, ek hi box mein
          </p>
          <h1 className="mt-5 text-[2.6rem] leading-[1.05] font-extrabold sm:text-6xl lg:text-[4.25rem]">
            Every file tool you need,{" "}
            <span className="relative whitespace-nowrap text-primary">
              in one box
              <svg
                aria-hidden="true"
                viewBox="0 0 300 16"
                preserveAspectRatio="none"
                className="absolute -bottom-1.5 left-0 h-3 w-full sm:-bottom-2"
              >
                <path
                  d="M3 11c60-8 140-10 294-4"
                  fill="none"
                  stroke="var(--saffron)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Merge, compress, convert and fix your PDFs, videos, audio and photos for free. Most tools run right
            in your browser, so your files never leave your device.
          </p>

          <div className="mt-8 max-w-xl">
            <HeroSearch />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-muted-foreground">Popular:</span>
            {quickPicks.map((slug, i) => {
              const tool = getTool(slug)!
              return (
                <Link
                  key={slug}
                  href={`/tools/${slug}`}
                  className={`items-center gap-1.5 rounded-full border bg-card py-1 pr-3 pl-1 text-sm font-medium transition hover:border-primary/50 hover:text-primary ${i > 3 ? "hidden sm:inline-flex" : "inline-flex"}`}
                >
                  <ToolIcon
                    icon={tool.icon}
                    category={tool.category}
                    size="sm"
                    className="size-6 rounded-full [&_svg]:size-3.5"
                  />
                  {tool.name}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="relative lg:pl-4">
          <SmartDrop />
        </div>
      </div>

      <div className="container-page pb-4">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border lg:grid-cols-4">
          {promises.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-2.5 bg-card p-4 sm:flex-row sm:items-center sm:gap-3 sm:p-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:size-10">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold sm:text-base">{title}</span>
                <span className="block text-xs text-muted-foreground sm:text-sm">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
