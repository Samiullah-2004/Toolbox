import Link from "next/link"
import { ArrowRight, Languages, MessageCircle, Smartphone, SquareUser } from "lucide-react"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/section-heading"

const features = [
  {
    icon: Languages,
    title: "Reads Urdu, not only English",
    text: "Copy text from Urdu and English scans. Most free tools only understand English.",
    href: "/tools/ocr",
    link: "Try OCR",
  },
  {
    icon: SquareUser,
    title: "CNIC and passport photos",
    text: "Crop to the official size with a plain background, ready for forms and applications.",
    href: "/tools/passport-photo",
    link: "Make a photo",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp ready",
    text: "Shrink videos under the 16 MB limit and turn any audio into a real voice note.",
    href: "/tools/whatsapp-voice-note",
    link: "Make a voice note",
  },
  {
    icon: Smartphone,
    title: "Made for phones",
    text: "Works in your phone's browser with no app to install. Large files get a clear warning.",
    href: "/tools",
    link: "See all tools",
  },
]

export function MadeForUs() {
  return (
    <section className="border-y bg-muted/40 py-16 sm:py-24">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow="Made for us"
            title="Built for students and everyday users in Pakistan"
            description="The small things other tool sites forget: Urdu, CNIC photos and the WhatsApp size limit."
          />
        </Reveal>
        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text, href, link }) => (
            <StaggerItem key={title}>
              <div className="group flex h-full flex-col rounded-3xl border bg-card p-6 transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
              <Link
                href={href}
                className="group/link mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary"
              >
                <span className="link-underline">{link}</span>
                <ArrowRight className="size-4 transition-transform group-hover/link:translate-x-1" aria-hidden="true" />
              </Link>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
