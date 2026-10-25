import Link from "next/link"
import { ArrowLeft, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Mascot } from "@/components/brand/mascot"

export default function NotFound() {
  return (
    <main id="main" className="flex flex-1 items-center">
      <div className="container-page flex flex-col items-center py-16 text-center sm:py-24">
        <Mascot mood="oops" className="w-48 sm:w-60" />
        <p className="mt-6 font-mono text-sm font-medium text-primary">Error 404</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">Oops, the toolbox got stuck.</h1>
        <p className="mt-3 max-w-md text-lg text-muted-foreground">
          We couldn&apos;t find this page. It may have moved, or the link has a typo.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">
              <ArrowLeft />
              Back to home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/tools">
              <LayoutGrid />
              See all tools
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
