import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LiveMascot } from "@/components/brand/live-mascot"
import { FaqSection } from "@/components/home/faq-section"
import { HowItWorks } from "@/components/home/how-it-works"
import { JugaadSection } from "@/components/home/jugaad-section"
import { MadeForUs } from "@/components/home/made-for-us"
import { PrivacySection } from "@/components/home/privacy-section"
import { tools } from "@/lib/tools"

export const metadata: Metadata = {
  title: "About",
  description:
    "How Toolbox works, where your files go, and why it is built for students and everyday users in Pakistan.",
}

export default function AboutPage() {
  return (
    <main id="main" className="flex-1">
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 dot-grid [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <div className="container-page grid items-center gap-8 py-12 sm:py-16 md:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="rise">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">About Toolbox</p>
            <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Har kaam ka tool, ek hi box mein</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Toolbox is a free website with {tools.length} tools for fixing everyday files. There is nothing to
              install and no account to make. Pick a tool, drop your file, and download the result.
            </p>
            <Button asChild size="lg" className="group mt-6">
              <Link href="/tools">
                Browse the tools
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          <LiveMascot className="mx-auto hidden w-56 animate-float md:block" />
        </div>
      </section>
      <HowItWorks />
      <PrivacySection />
      <MadeForUs />
      <JugaadSection />
      <FaqSection />
    </main>
  )
}
