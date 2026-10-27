import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cn } from "cn"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { PrivacyLegend } from "@/components/home/tool-compartments"
import { ToolCard } from "@/components/tools/tool-card"
import { ToolIcon } from "@/components/tools/tool-icon"
import { categoryStyles } from "@/lib/category-styles"
import { riseDelay } from "@/lib/motion"
import { categories, getCategory, isCategoryId, toolsInCategory } from "@/lib/tools"

export function generateStaticParams() {
  return categories.map((category) => ({ id: category.id }))
}

export async function generateMetadata({ params }: PageProps<"/category/[id]">): Promise<Metadata> {
  const { id } = await params
  if (!isCategoryId(id)) return {}
  const category = getCategory(id)
  return { title: `${category.name} tools`, description: category.description }
}

export default function CategoryPage({ params }: PageProps<"/category/[id]">) {
  return (
    <main id="main" className="flex-1">
      <Suspense fallback={<CategorySkeleton />}>
        <CategoryContent params={params} />
      </Suspense>
    </main>
  )
}

async function CategoryContent({ params }: { params: PageProps<"/category/[id]">["params"] }) {
  const { id } = await params
  if (!isCategoryId(id)) notFound()
  const category = getCategory(id)
  const styles = categoryStyles[id]
  const list = toolsInCategory(id)

  return (
    <>
      <section className="relative isolate overflow-hidden border-b">
        <div aria-hidden="true" className={cn("absolute inset-0 -z-10", styles.soft)} />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 dot-grid [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <div className="container-page py-6 sm:py-10">
          <Breadcrumb className="rise">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/tools">All tools</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{category.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="rise mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6" style={riseDelay(80)}>
            <ToolIcon
              icon={category.icon}
              category={id}
              size="lg"
              className="shadow-sm transition-transform duration-300 hover:-rotate-6 hover:scale-110"
            />
            <div className="min-w-0 space-y-2">
              <p className={cn("text-sm font-semibold", styles.text)}>
                {category.localName} &middot; means &ldquo;{category.localMeaning}&rdquo;
              </p>
              <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl">{category.name}</h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                {category.description} {list.length} free tools.
              </p>
            </div>
          </div>
          <PrivacyLegend className="rise mt-5 [--delay:160ms]" />
        </div>
      </section>

      <div className="container-page py-8 sm:py-10">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((tool, i) => (
            <li key={tool.slug} className="rise" style={riseDelay(200 + i * 60)}>
              <ToolCard tool={tool} />
            </li>
          ))}
        </ul>

        <div className="mt-12 border-t pt-8">
          <h2 className="font-sans text-base font-semibold tracking-normal">Other compartments</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {categories
              .filter((c) => c.id !== id)
              .map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/category/${c.id}`}
                    className="group flex items-center gap-2 rounded-full border bg-card py-1 pr-3.5 pl-1 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary hover:shadow-md active:scale-95"
                  >
                    <ToolIcon
                      icon={c.icon}
                      category={c.id}
                      size="sm"
                      className="size-7 rounded-full transition-transform duration-300 group-hover:-rotate-12 [&_svg]:size-3.5"
                    />
                    {c.name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </>
  )
}

function CategorySkeleton() {
  const block = "animate-pulse rounded-lg bg-muted"
  return (
    <div aria-busy="true" aria-label="Loading tools">
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
        </div>
      </section>
      <div className="container-page grid gap-4 py-8 sm:grid-cols-2 sm:py-10 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn(block, "h-48 rounded-2xl")} />
        ))}
      </div>
    </div>
  )
}
