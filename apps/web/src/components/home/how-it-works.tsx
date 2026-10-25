import { Download, MousePointerClick, Upload } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"

const steps = [
  {
    icon: MousePointerClick,
    title: "Pick a tool",
    text: "Search for what you need, or open a compartment and choose a tool.",
  },
  {
    icon: Upload,
    title: "Drop your file",
    text: "Drag it in or tap to choose. Most tools never upload it anywhere.",
  },
  {
    icon: Download,
    title: "Download the result",
    text: "Save it, or send it straight into the next tool with Jugaad Mode.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y bg-muted/40 py-16 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps. No software to install."
          description="If you can send a WhatsApp photo, you can use Toolbox."
        />
        <div className="relative mt-12">
          {/* dashed line joining the steps on wide screens */}
          <div
            aria-hidden="true"
            className="absolute top-14 right-[16%] left-[16%] hidden border-t-2 border-dashed border-primary/30 md:block"
          />
          <ol className="relative grid gap-5 md:grid-cols-3 md:gap-8">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative flex gap-4 rounded-3xl border bg-card p-6 md:flex-col md:items-center md:text-center">
                <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 md:size-16">
                  <Icon className="size-6 md:size-7" aria-hidden="true" />
                  <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border-2 border-card bg-saffron text-xs font-bold text-[#1e2433]">
                    {i + 1}
                  </span>
                </span>
                <div>
                  <h3 className="text-lg font-bold md:mt-2">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
