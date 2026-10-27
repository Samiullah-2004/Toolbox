import { Logo } from "@/components/brand/logo"
import { CommandSearch } from "@/components/layout/command-search"
import { HeaderShell } from "@/components/layout/header-shell"
import { MainNav } from "@/components/layout/main-nav"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ThemeToggle } from "@/components/layout/theme-toggle"

/** Total height: 4px stripe + 64px bar + 1px border = 69px (sticky offsets rely on this) */
export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="truck-stripe h-1" aria-hidden="true" />
      <div className="container-page flex h-16 items-center gap-2">
        <Logo className="mr-2 xl:mr-6" />
        <div className="hidden lg:flex">
          <MainNav />
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <CommandSearch />
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </HeaderShell>
  )
}
