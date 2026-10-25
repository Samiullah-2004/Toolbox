import { cn } from "cn"

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: "center" | "left"
  className?: string
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <p className="text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-base text-muted-foreground sm:text-lg">{description}</p>}
    </div>
  )
}
