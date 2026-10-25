import { CloudUpload, Lock } from "lucide-react"
import { cn } from "cn"
import type { RunsOn } from "@/lib/tools"

export const privacyCopy = {
  browser: { short: "On device", label: "Stays on your device" },
  server: { short: "Deleted in 1 hr", label: "Uploaded, deleted after 1 hour" },
} as const

export function PrivacyBadge({
  runsOn,
  variant = "full",
  className,
}: {
  runsOn: RunsOn
  variant?: "full" | "short"
  className?: string
}) {
  const Icon = runsOn === "browser" ? Lock : CloudUpload
  const copy = privacyCopy[runsOn]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        runsOn === "browser" ? "bg-success/12 text-success" : "bg-teal/12 text-teal",
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {variant === "short" ? (
        <>
          {copy.short}
          <span className="sr-only">: {copy.label}</span>
        </>
      ) : (
        copy.label
      )}
    </span>
  )
}

/** Icon-only version for dense lists, with a legend shown nearby */
export function PrivacyDot({ runsOn }: { runsOn: RunsOn }) {
  const Icon = runsOn === "browser" ? Lock : CloudUpload
  return (
    <span
      title={privacyCopy[runsOn].label}
      className={cn("inline-flex", runsOn === "browser" ? "text-success" : "text-teal")}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="sr-only">{privacyCopy[runsOn].label}</span>
    </span>
  )
}
