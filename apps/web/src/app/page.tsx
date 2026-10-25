import { CtaBand } from "@/components/home/cta-band"
import { FaqSection } from "@/components/home/faq-section"
import { Hero } from "@/components/home/hero"
import { HowItWorks } from "@/components/home/how-it-works"
import { JugaadSection } from "@/components/home/jugaad-section"
import { MadeForUs } from "@/components/home/made-for-us"
import { PrivacySection } from "@/components/home/privacy-section"
import { ToolCompartments } from "@/components/home/tool-compartments"

export default function HomePage() {
  return (
    <main id="main" className="flex-1">
      <Hero />
      <ToolCompartments />
      <HowItWorks />
      <PrivacySection />
      <MadeForUs />
      <JugaadSection />
      <FaqSection />
      <CtaBand />
    </main>
  )
}
