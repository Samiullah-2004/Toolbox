import Link from "next/link"
import { CloudUpload, Lock } from "lucide-react"
import { cn } from "cn"
import { SectionHeading } from "@/components/section-heading"
import { PrivacyBadge } from "@/components/tools/privacy-badge"
import { getTool, tools } from "@/lib/tools"

const modes = [
  {
    runsOn: "browser" as const,
    icon: Lock,
    title: "On your device",
    text: "The tool runs inside your browser using your own phone or laptop. Your file never leaves your device, so not even we can see it.",
    examples: ["merge-pdf", "video-to-mp3", "heic-to-jpg", "sign-pdf"],
    tone: "bg-success/10 text-success",
  },
  {
    runsOn: "server" as const,
    icon: CloudUpload,
    title: "On our server",
    text: "Smart jobs like reading Urdu text need our server. Your file is sent over a secure connection and deleted on its own after 1 hour.",
    examples: ["ocr", "pdf-to-word", "speech-to-text", "compress-pdf"],
    tone: "bg-teal/10 text-teal",
  },
]

export function PrivacySection() {
  return (
    <section id="privacy" className="py-16 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Privacy first"
          title="You always know where your file goes"
          description="Every tool carries one of two labels, so there are no surprises."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {modes.map((mode) => {
            const count = tools.filter((t) => t.runsOn === mode.runsOn).length
            return (
              <div key={mode.runsOn} className="flex flex-col rounded-3xl border bg-card p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <span className={cn("flex size-12 items-center justify-center rounded-2xl", mode.tone)}>
                    <mode.icon className="size-6" aria-hidden="true" />
                  </span>
                  <span className="text-right">
                    <span className="block font-heading text-3xl font-bold">{count}</span>
                    <span className="block text-xs text-muted-foreground">tools</span>
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-bold">{mode.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{mode.text}</p>
                <div className="mt-5">
                  <PrivacyBadge runsOn={mode.runsOn} />
                </div>
                <div className="mt-6 flex flex-wrap gap-2 border-t pt-5">
                  <span className="mr-1 self-center text-xs text-muted-foreground">For example:</span>
                  {mode.examples.map((slug) => (
                    <Link
                      key={slug}
                      href={`/tools/${slug}`}
                      className="rounded-full border bg-background px-3 py-1 text-sm font-medium transition hover:border-primary/50 hover:text-primary"
                    >
                      {getTool(slug)!.name}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
