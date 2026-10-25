import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Check, CloudUpload, Lightbulb, Lock } from "lucide-react"
import { cn } from "cn"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Mascot } from "@/components/brand/mascot"
import { PrivacyBadge } from "@/components/tools/privacy-badge"
import { ToolCard } from "@/components/tools/tool-card"
import { ToolIcon } from "@/components/tools/tool-icon"
import { ToolWorkspace } from "@/components/tools/tool-workspace"
import { categoryStyles } from "@/lib/category-styles"
import {
  fileNoun,
  getCategory,
  getTool,
  hasPageLimit,
  maxFileSizeMB,
  relatedTools,
  SERVER_PAGE_LIMIT,
  tools,
  type Tool,
} from "@/lib/tools"

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }))
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const tool = getTool(slug)
  if (!tool) return {}
  return {
    title: `${tool.name}: free online tool`,
    description: `${tool.description} Free, no watermark${tool.runsOn === "browser" ? ", and your file never leaves your device" : ""}.`,
  }
}

// The page shell renders right away on client navigation; everything that
// depends on the tool streams in behind a matching skeleton.
export default function ToolPage({ params }: PageProps<"/tools/[slug]">) {
  return (
    <main id="main" className="flex-1">
      <Suspense fallback={<ToolPageSkeleton />}>
        <ToolPageContent params={params} />
      </Suspense>
    </main>
  )
}

async function ToolPageContent({ params }: { params: PageProps<"/tools/[slug]">["params"] }) {
  const { slug } = await params
  const tool = getTool(slug)
  if (!tool) notFound()
  const category = getCategory(tool.category)
  const styles = categoryStyles[tool.category]

  return (
    <>
      <section className="relative isolate overflow-hidden border-b">
        <div aria-hidden="true" className={cn("absolute inset-0 -z-10", styles.soft)} />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 dot-grid [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <div className="container-page py-6 sm:py-10">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/category/${category.id}`}>{category.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem className="hidden sm:inline-flex">
                <BreadcrumbPage>{tool.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <ToolIcon icon={tool.icon} category={tool.category} size="lg" className="shadow-sm" />
            <div className="min-w-0 space-y-2">
              <p className={cn("text-sm font-semibold", styles.text)}>
                {category.name} &middot; {category.localName}
              </p>
              <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl">{tool.name}</h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{tool.description}</p>
            </div>
          </div>

          <ul className="mt-5 flex flex-wrap gap-2">
            <li>
              <PrivacyBadge runsOn={tool.runsOn} />
            </li>
            {["Free", "No watermark", ...(tool.runsOn === "browser" ? ["No sign-up"] : [])].map((label) => (
              <li
                key={label}
                className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium"
              >
                <Check className="size-3.5 text-primary" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="container-page grid gap-6 py-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3 pr-4 sm:gap-4">
            <Mascot mood="working" className="w-16 shrink-0 sm:w-20" label="Mistri at work" />
            <div>
              <p className="font-semibold">Mistri is still building this tool</p>
              <p className="text-sm text-muted-foreground">
                It is planned for Week {tool.week}. You can already try the upload area, but nothing is processed
                yet.
              </p>
            </div>
          </div>
          <ToolWorkspace slug={tool.slug} />
        </div>

        <aside className="space-y-4">
          <HowToCard tool={tool} />
          <PrivacyCard tool={tool} />
          <div className="rounded-3xl border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="size-4 text-saffron" aria-hidden="true" />
              Real-life example
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tool.example}.</p>
          </div>
        </aside>
      </div>

      <section className="border-t bg-muted/40">
        <div className="container-page py-12 sm:py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">You might also need</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedTools(tool).map((related) => (
              <li key={related.slug}>
                <ToolCard tool={related} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}

function ToolPageSkeleton() {
  const block = "animate-pulse rounded-lg bg-muted"
  return (
    <div aria-busy="true" aria-label="Loading tool">
      <section className="border-b">
        <div className="container-page py-6 sm:py-10">
          <div className={cn(block, "h-4 w-56")} />
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className={cn(block, "size-14 rounded-2xl")} />
            <div className="flex-1 space-y-3">
              <div className={cn(block, "h-4 w-40")} />
              <div className={cn(block, "h-10 w-72 max-w-full")} />
              <div className={cn(block, "h-5 w-full max-w-xl")} />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <div className={cn(block, "h-6 w-40 rounded-full")} />
            <div className={cn(block, "h-6 w-16 rounded-full")} />
            <div className={cn(block, "h-6 w-28 rounded-full")} />
          </div>
        </div>
      </section>
      <div className="container-page grid gap-6 py-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <div className={cn(block, "h-20 rounded-2xl")} />
          <div className={cn(block, "h-96 rounded-3xl")} />
        </div>
        <div className="space-y-4">
          <div className={cn(block, "h-52 rounded-3xl")} />
          <div className={cn(block, "h-36 rounded-3xl")} />
        </div>
      </div>
    </div>
  )
}

function HowToCard({ tool }: { tool: Tool }) {
  const first =
    tool.input === "text"
      ? "Type or paste your text into the box."
      : tool.input === "record"
        ? "Choose what to record: your screen or your voice."
        : `Choose your ${fileNoun(tool)}, or drop ${tool.multiple ? "them" : "it"} on the page.`
  const last =
    tool.input === "record" ? "Stop when you're done and download the recording." : `Press "${tool.actionLabel}" and download the result.`
  const steps = [first, tool.step, last]

  return (
    <div className="rounded-3xl border bg-card p-5">
      <h2 className="font-sans text-base font-semibold tracking-normal">How to use {tool.name}</h2>
      <ol className="mt-4 space-y-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <span className="pt-0.5 text-sm leading-relaxed text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function PrivacyCard({ tool }: { tool: Tool }) {
  const onDevice = tool.runsOn === "browser"
  const Icon = onDevice ? Lock : CloudUpload
  return (
    <div className={cn("rounded-3xl border p-5", onDevice ? "bg-success/[0.06]" : "bg-teal/[0.06]")}>
      <p className={cn("flex items-center gap-2 text-sm font-semibold", onDevice ? "text-success" : "text-teal")}>
        <Icon className="size-4" aria-hidden="true" />
        {onDevice ? "Your file stays on your device" : "Deleted after 1 hour"}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {onDevice
          ? "This tool runs inside your browser. Nothing is uploaded, so not even we can see your file."
          : "This tool needs our server. Your file is sent over a secure connection, used only for this job and deleted on its own after 1 hour."}
      </p>
      {tool.input === "files" && (
        <p className="mt-3 text-xs text-muted-foreground">
          Limit: {maxFileSizeMB(tool)} MB per file
          {hasPageLimit(tool) && `, ${SERVER_PAGE_LIMIT} pages`}.
        </p>
      )}
    </div>
  )
}
