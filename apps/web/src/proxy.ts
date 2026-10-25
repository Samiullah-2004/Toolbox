import { NextResponse, type NextRequest } from "next/server"
import { getTool, isCategoryId } from "@/lib/tools"

// Tool and category pages stream behind <Suspense>, so a notFound() inside them would
// arrive after a 200 status was already sent. Checking the name here, before rendering,
// lets unknown addresses get a real 404 status.
export function proxy(request: NextRequest) {
  const [, section, name] = request.nextUrl.pathname.split("/")
  const known = section === "tools" ? !!getTool(name) : isCategoryId(name)
  if (known) return NextResponse.next()
  // No route matches this path, so Next.js renders app/not-found.tsx with a 404 status
  return NextResponse.rewrite(new URL("/__not-found", request.url))
}

export const config = {
  matcher: ["/tools/:name", "/category/:name"],
}
