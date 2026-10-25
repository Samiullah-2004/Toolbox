import Link from "next/link"
import { ArrowRight, Workflow } from "lucide-react"
import { ToolIcon } from "@/components/tools/tool-icon"
import { getTool } from "@/lib/tools"

const chains = [
  { title: "Lecture video to voice note", steps: ["video-to-mp3", "trim-audio", "whatsapp-voice-note"] },
  { title: "Phone photos to one small PDF", steps: ["document-scanner", "merge-pdf", "compress-pdf"] },
  { title: "iPhone selfie to passport photo", steps: ["heic-to-jpg", "remove-background", "passport-photo"] },
]

export function JugaadSection() {
  return (
    <section id="jugaad" className="py-16 sm:py-24">
      <div className="container-page">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-[oklch(0.25_0.04_230)] px-5 py-12 text-white sm:px-10 sm:py-14 lg:px-14">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 truck-stripe" />
          <div
            aria-hidden="true"
            className="absolute -right-24 -bottom-32 -z-10 size-96 rounded-full bg-[oklch(0.67_0.2_44/0.35)] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -top-24 -left-24 -z-10 size-80 rounded-full bg-[oklch(0.6_0.1_200/0.3)] blur-3xl"
          />

          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-center lg:gap-12">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-[oklch(0.86_0.15_88)]">
                <Workflow className="size-4" aria-hidden="true" />
                Jugaad Mode &middot; coming soon
              </p>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Chain tools together. Upload once.</h2>
              <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">
                The result of one tool goes straight into the next one. No downloading and uploading the same
                file again and again. One button, the whole job done.
              </p>
            </div>

            <ul className="space-y-3">
              {chains.map((chain) => (
                <li key={chain.title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm sm:p-5">
                  <p className="text-sm font-semibold text-white/90">{chain.title}</p>
                  <ol className="mt-3 flex flex-wrap items-center gap-1.5">
                    {chain.steps.map((slug, i) => {
                      const tool = getTool(slug)!
                      return (
                        <li key={slug} className="flex items-center gap-1.5">
                          {i > 0 && <ArrowRight className="size-3.5 text-white/40" aria-hidden="true" />}
                          <Link
                            href={`/tools/${slug}`}
                            className="flex items-center gap-1.5 rounded-xl bg-white py-1 pr-2.5 pl-1 text-[0.8rem] font-medium text-[#1e2433] transition hover:-translate-y-0.5 hover:shadow-lg sm:text-sm"
                          >
                            <ToolIcon
                              icon={tool.icon}
                              category={tool.category}
                              size="sm"
                              className="size-6 rounded-md [&_svg]:size-3.5"
                            />
                            {tool.name}
                          </Link>
                        </li>
                      )
                    })}
                  </ol>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
