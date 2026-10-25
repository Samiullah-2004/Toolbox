import Link from "next/link"
import { cn } from "cn"

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="8" fill="var(--brand)" />
      <path
        d="M12.5 11V9.2a1.7 1.7 0 0 1 1.7-1.7h3.6a1.7 1.7 0 0 1 1.7 1.7V11"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect x="6" y="11" width="20" height="14" rx="3" fill="#fff" />
      <rect x="6" y="16.6" width="20" height="1.6" fill="var(--brand)" />
      <rect x="14.2" y="15.4" width="3.6" height="4" rx="0.9" fill="#1e2433" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      aria-label="Toolbox home"
    >
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className="font-heading text-xl font-bold tracking-tight">Toolbox</span>
    </Link>
  )
}
