"use client"

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
import { useTheme, type Theme } from "@/lib/theme"

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          {/* CSS picks the icon, so it is right before JavaScript loads */}
          <Sun className="dark:hidden" />
          <Moon className="hidden dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
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

/** Segmented version for the mobile menu */
export function ThemeSegmented() {
  const { theme, setTheme } = useTheme()
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-muted-foreground transition",
            theme === value && "bg-background text-foreground shadow-sm"
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  )
}
