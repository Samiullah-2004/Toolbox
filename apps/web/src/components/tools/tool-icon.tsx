import { cn } from "cn"
import { categoryStyles } from "@/lib/category-styles"
import { icons, type IconName } from "@/lib/icons"
import type { CategoryId } from "@/lib/tools"

const sizes = {
  sm: "size-8 rounded-lg [&_svg]:size-4",
  md: "size-11 rounded-xl [&_svg]:size-5",
  lg: "size-14 rounded-2xl [&_svg]:size-7",
}

export function ToolIcon({
  icon,
  category,
  size = "md",
  className,
}: {
  icon: IconName
  category: CategoryId
  size?: keyof typeof sizes
  className?: string
}) {
  const Icon = icons[icon]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        sizes[size],
        categoryStyles[category].tile,
        className
      )}
    >
      <Icon aria-hidden="true" strokeWidth={2} />
    </span>
  )
}
