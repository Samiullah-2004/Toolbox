import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { BackToTop } from "@/components/layout/back-to-top"
import { MotionProvider } from "@/components/motion/motion-provider"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { ThemeScript } from "@/components/layout/theme-script"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Toolbox: Free PDF, Video, Audio and Image Tools",
    template: "%s | Toolbox",
  },
  description:
    "Merge, compress, convert and fix PDFs, videos, audio and photos for free. Most tools run in your browser, so your files never leave your device.",
  applicationName: "Toolbox",
  keywords: ["merge pdf", "compress pdf", "video to mp3", "heic to jpg", "urdu ocr", "passport photo", "free tools"],
  authors: [{ name: "Sami" }],
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0f171d" },
  ],
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // the theme script adds the "dark" class before React hydrates
      suppressHydrationWarning
      // keeps CSS smooth scrolling for in-page links, but jumps instantly on route changes
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <MotionProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <BackToTop />
        </MotionProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  )
}
