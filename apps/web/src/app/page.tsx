import { Hero } from "@/components/home/hero"
import { ToolCompartments } from "@/components/home/tool-compartments"

// Kept short on purpose: what Toolbox is, then the tool categories.
// The longer explanations live on /about.
export default function HomePage() {
  return (
    <main id="main" className="flex-1">
      <Hero />
      <ToolCompartments />
    </main>
  )
}
