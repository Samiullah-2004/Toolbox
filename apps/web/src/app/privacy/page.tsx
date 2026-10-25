import type { Metadata } from "next"
import Link from "next/link"
import { CloudUpload, EyeOff, Lock, Timer } from "lucide-react"
import { PrivacyBadge } from "@/components/tools/privacy-badge"
import { tools } from "@/lib/tools"

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Toolbox handles your files: most tools never upload them, and server tools delete them after 1 hour.",
}

const browserCount = tools.filter((t) => t.runsOn === "browser").length
const serverCount = tools.length - browserCount

const points = [
  {
    icon: Lock,
    title: `${browserCount} tools never upload your file`,
    text: "They run inside your browser using your own device. The file stays with you from start to finish.",
  },
  {
    icon: CloudUpload,
    title: `${serverCount} tools use our server`,
    text: "Jobs like Urdu OCR and speech to text need more power. The file is sent over a secure (HTTPS) connection and used only for your job.",
  },
  {
    icon: Timer,
    title: "Deleted after 1 hour",
    text: "Files sent to our server are deleted on their own after 1 hour, whether you download the result or not.",
  },
  {
    icon: EyeOff,
    title: "We never look inside",
    text: "We don't read, keep, share or log the contents of your files. We only keep basic usage numbers, like how many jobs ran today.",
  },
]

export default function PrivacyPage() {
  return (
    <main id="main" className="flex-1">
      <div className="container-page max-w-3xl py-12 sm:py-16">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">Privacy</p>
        <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Your files are your business</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Toolbox is built so that most work happens on your own device. When a tool does need our server, it
          tells you before you start.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <PrivacyBadge runsOn="browser" />
          <PrivacyBadge runsOn="server" />
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {points.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-3xl border bg-card p-6">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-sans text-lg font-semibold tracking-normal">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-3xl border bg-muted/50 p-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Signing in is optional.</span> If you sign in with
            Google or GitHub, we store your name, email and a list of your past jobs so you can see your history.
            You can use every tool without an account.
          </p>
          <p className="mt-3">
            Questions? Read the{" "}
            <Link href="/#faq" className="font-medium text-primary underline-offset-4 hover:underline">
              FAQ
            </Link>{" "}
            or browse the{" "}
            <Link href="/tools" className="font-medium text-primary underline-offset-4 hover:underline">
              tools
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
