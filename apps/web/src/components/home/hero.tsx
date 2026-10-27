import { Gift, Lock, Smartphone, Zap } from "lucide-react"
import { HeroDoodles } from "@/components/home/hero-doodles"
import { HeroSearch } from "@/components/home/hero-search"
import { SmartDrop } from "@/components/home/smart-drop"
import { riseDelay } from "@/lib/motion"

const promises = [
  { icon: Gift, title: "100% free", text: "No watermark, no hidden fees" },
  { icon: Zap, title: "No sign-up", text: "No account or login, ever" },
  { icon: Lock, title: "Private", text: "Most tools never upload files" },
  { icon: Smartphone, title: "Any device", text: "Phone, tablet or laptop" },
]

// Entrance animations here are pure CSS (`rise`, `draw-in`) so they play on first paint,
// before JavaScript loads. Content is never hidden waiting for code.
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 dot-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
      />
      <HeroDoodles />

      <div className="container-page grid items-center gap-10 pt-10 pb-12 sm:pt-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14 lg:pt-20 lg:pb-16">
        <div className="relative z-20">
          <p
            className="rise inline-flex items-center gap-2.5 rounded-full border bg-card/80 py-1.5 pr-3.5 pl-2.5 text-sm font-medium shadow-sm"
            style={riseDelay(0)}
          >
            {/* three truck-art dots */}
            <span aria-hidden="true" className="flex gap-1">
              <span className="size-2 rounded-full bg-brand" />
              <span className="size-2 rounded-full bg-saffron" />
              <span className="size-2 rounded-full bg-teal" />
            </span>
            Har kaam ka tool, ek hi box mein
          </p>
          <h1 className="mt-5 text-[2.6rem] leading-[1.05] font-extrabold sm:text-6xl lg:text-[4.25rem]">
            <span className="rise inline-block" style={riseDelay(80)}>
              Every file tool
            </span>{" "}
            <span className="rise inline-block" style={riseDelay(160)}>
              you need,
            </span>{" "}
            <span className="rise relative inline-block whitespace-nowrap text-primary" style={riseDelay(240)}>
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
                  className="draw-in"
                  style={{ "--length": 310, "--delay": "650ms" } as React.CSSProperties}
                />
              </svg>
            </span>
            <span className="rise inline-block" style={riseDelay(240)}>
              .
            </span>
          </h1>
          <p
            className="rise mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
            style={riseDelay(320)}
          >
            Free online tools to merge, compress and convert your PDFs, videos, audio and photos. No sign-up,
            no app to install.
          </p>

          <div className="rise mt-8 max-w-xl" style={riseDelay(400)}>
            <HeroSearch />
          </div>
        </div>

        <div className="rise relative lg:pl-4" style={riseDelay(300)}>
          <SmartDrop />
        </div>
      </div>

      <div className="container-page pb-4">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border lg:grid-cols-4">
          {promises.map(({ icon: Icon, title, text }, i) => (
            <li
              key={title}
              className="rise group flex flex-col gap-2.5 bg-card p-4 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:gap-3 sm:p-5"
              style={riseDelay(480 + i * 70)}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-transform duration-300 group-hover:scale-110 sm:size-10">
                <Icon className="size-5 group-hover:animate-nudge" aria-hidden="true" />
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
