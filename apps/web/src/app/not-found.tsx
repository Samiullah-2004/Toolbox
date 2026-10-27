import Link from "next/link"
import { ArrowLeft, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LiveMascot } from "@/components/brand/live-mascot"
import { riseDelay } from "@/lib/motion"

export default function NotFound() {
  return (
    <main id="main" className="flex flex-1 items-center">
      <div className="container-page flex flex-col items-center py-16 text-center sm:py-24">
        <div className="rise">
          {/* Mistri looks around for the missing page, following your mouse */}
          <LiveMascot mood="oops" className="w-48 animate-float sm:w-60" />
        </div>
        <p className="rise mt-6 font-mono text-sm font-medium text-primary" style={riseDelay(100)}>
          Error 404
        </p>
        <h1 className="rise mt-2 text-3xl font-extrabold sm:text-5xl" style={riseDelay(160)}>
          Oops, the toolbox got stuck.
        </h1>
        <p className="rise mt-3 max-w-md text-lg text-muted-foreground" style={riseDelay(220)}>
          We couldn&apos;t find this page. It may have moved, or the link has a typo.
        </p>
        <div className="rise mt-8 flex flex-col gap-3 sm:flex-row" style={riseDelay(300)}>
          <Button asChild size="lg" className="group">
            <Link href="/">
              <ArrowLeft className="transition-transform group-hover:-translate-x-1" />
              Back to home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="group">
            <Link href="/tools">
              <LayoutGrid className="transition-transform group-hover:rotate-90" />
              See all tools
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
