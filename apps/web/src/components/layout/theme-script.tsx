"use client"

import { themeInitScript } from "@/lib/theme-script"

/**
 * Sets the theme class before first paint. On the server it renders a runnable script;
 * if React ever renders it on the client (e.g. error recovery) it becomes inert text/plain,
 * which avoids React's "script tag while rendering" error. See the Next.js guide
 * "Preventing flash before hydration".
 */
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  )
}
