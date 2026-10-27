"use client"

import { useRef } from "react"
import { m } from "motion/react"
import { Monitor, Moon, Sun } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { switchTheme, useTheme, type Theme } from "@/lib/theme"

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
]

export function ThemeToggle() {
  const { theme } = useTheme()
  const triggerRef = useRef<HTMLButtonElement>(null)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={triggerRef} variant="ghost" size="icon" aria-label="Change theme" className="relative overflow-hidden">
          {/* CSS picks and morphs the icon, so it is right even before JavaScript loads */}
          <Sun className="absolute transition-all duration-500 ease-out dark:scale-0 dark:-rotate-90 dark:opacity-0" />
          <Moon className="absolute scale-0 rotate-90 opacity-0 transition-all duration-500 ease-out dark:scale-100 dark:rotate-0 dark:opacity-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => switchTheme(v as Theme, triggerRef.current)}>
          {options.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="py-1.5">
              <Icon />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Segmented version for the mobile menu, with a thumb that slides to the chosen option */
export function ThemeSegmented() {
  const { theme } = useTheme()
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={(e) => switchTheme(value, e.currentTarget)}
          className={cn(
            "relative isolate flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-muted-foreground transition-colors",
            theme === value && "text-foreground"
          )}
        >
          {theme === value && (
            <m.span layoutId="theme-thumb" className="absolute inset-0 -z-10 rounded-lg bg-background shadow-sm" />
          )}
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  )
}
