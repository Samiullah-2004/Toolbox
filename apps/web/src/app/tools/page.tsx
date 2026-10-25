import type { Metadata } from "next"
import { PrivacyLegend } from "@/components/home/tool-compartments"
import { ToolExplorer } from "@/components/tools/tool-explorer"
import { tools } from "@/lib/tools"

export const metadata: Metadata = {
  title: "All tools",
  description: `${tools.length} free tools for PDF, video, audio and images. Search by name or by what you want to do.`,
}

export default function ToolsPage() {
  return (
    <main id="main" className="flex-1">
      <section className="relative isolate overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 dot-grid [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <div className="container-page py-10 sm:py-14">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">The whole box</p>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">All tools</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {tools.length} free tools for PDF, video, audio and images. Search by name or by what you want to do,
            like &ldquo;make it smaller&rdquo;.
          </p>
          <PrivacyLegend className="mt-5" />
        </div>
      </section>
      <ToolExplorer />
    </main>
  )
}
