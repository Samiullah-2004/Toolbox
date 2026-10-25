import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Mascot } from "@/components/brand/mascot"

export function CtaBand() {
  return (
    <section className="pb-16 sm:pb-24">
      <div className="container-page">
        <div className="relative isolate grid items-center gap-6 overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground sm:px-10 md:grid-cols-[minmax(0,1fr)_14rem] lg:px-14 lg:py-12">
          <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-20 dot-grid" />
          <div>
            <p className="text-sm font-semibold tracking-wide uppercase opacity-80">Got a file problem?</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Fixed before your chai gets cold.</h2>
            <p className="mt-3 max-w-lg text-base opacity-90 sm:text-lg">
              Pick a tool, drop your file and download. It really is that simple.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tools"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-background px-6 font-semibold text-foreground shadow-lg transition hover:-translate-y-0.5"
              >
                Browse all tools
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-current/30 px-6 font-semibold transition hover:bg-black/5"
              >
                How it works
              </Link>
            </div>
          </div>
          <div className="mx-auto hidden size-56 items-center justify-center rounded-full bg-background p-7 shadow-2xl shadow-black/20 md:flex">
            <Mascot />
          </div>
        </div>
      </div>
    </section>
  )
}
