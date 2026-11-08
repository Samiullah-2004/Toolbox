"use client"

import { useEffect, useState } from "react"
import { cn } from "cn"
import { Textarea } from "@/components/ui/textarea"
import { asJob, EditorWorkspace, type EditorProps } from "@/components/tools/editor-workspace"
import { ChoiceCards, Notice } from "@/components/tools/media/media-parts"
import { useToolSession } from "@/components/tools/tool-session"
import { ActionButton, WorkspaceFooter } from "@/components/tools/workspace-parts"
import { formatBytes } from "@/lib/format"
import type { Tool } from "@/lib/tools"

type Kind = "text" | "whatsapp" | "wifi"
type Security = "WPA" | "WEP" | "nopass"

const inks = ["#1e2433", "#000000", "#b4471b", "#0f6b5c", "#3b2a8c"]

const field =
  "mt-1 h-11 w-full rounded-xl border bg-background px-3 text-base outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15 sm:text-sm"

/** Wi-Fi codes need \ ; , : and " to be escaped */
const wifiEscape = (value: string) => value.replace(/([\\;,:"])/g, "\\$1")

/** "0300 1234567" or "+92 300 1234567" -> "923001234567" (Pakistan numbers get +92 added) */
function whatsappNumber(raw: string) {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("00")) return digits.slice(2)
  if (digits.startsWith("0")) return `92${digits.slice(1)}`
  return digits
}

/** Medium error correction: the code still scans when it is a little dirty or creased */
const qrOptions = (ink: string) => ({ margin: 2, errorCorrectionLevel: "M" as const, color: { dark: ink, light: "#ffffff" } })

/** How light a colour is, 0 (black) to 1 (white) */
function lightness(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function QrEditor({ tool, onRun }: EditorProps) {
  const { text, setText } = useToolSession()
  const [kind, setKind] = useState<Kind>("text")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [network, setNetwork] = useState("")
  const [password, setPassword] = useState("")
  const [security, setSecurity] = useState<Security>("WPA")
  const [ink, setInk] = useState(inks[0])
  const [size, setSize] = useState(512)
  const [format, setFormat] = useState<"png" | "svg">("png")
  const [preview, setPreview] = useState<{ url: string; error: false } | { error: true } | null>(null)

  const number = whatsappNumber(phone)
  const content =
    kind === "text"
      ? text.trim()
      : kind === "whatsapp"
        ? number.length >= 10
          ? `https://wa.me/${number}${message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ""}`
          : ""
        : network.trim()
          ? `WIFI:T:${security};S:${wifiEscape(network.trim())};${security === "nopass" ? "" : `P:${wifiEscape(password)};`};`
          : ""
  const tooLight = lightness(ink) > 0.55

  // Draw the code as the person types
  useEffect(() => {
    if (!content) return
    let current = true
    import("qrcode")
      .then(({ default: QR }) => QR.toDataURL(content, { ...qrOptions(ink), width: 320 }))
      .then((url) => current && setPreview({ url, error: false }))
      .catch(() => current && setPreview({ error: true }))
    return () => {
      current = false
    }
  }, [content, ink])

  const shown = content ? preview : null
  const ready = !!content && shown !== null && !shown.error

  const run = () =>
    onRun({
      working: "Making your QR code",
      run: async () => {
        const { default: QR } = await import("qrcode")
        const name = kind === "wifi" ? `Wi-Fi ${network.trim()}` : kind === "whatsapp" ? `WhatsApp ${number}` : "QR code"
        if (format === "svg") {
          const svg = await QR.toString(content, { ...qrOptions(ink), type: "svg", width: size })
          const bytes = new TextEncoder().encode(svg)
          return { bytes, fileName: `${name}.svg`, type: "image/svg+xml", summary: `An SVG QR code that stays sharp at any size, ${formatBytes(bytes.length)}.` }
        }
        const url = await QR.toDataURL(content, { ...qrOptions(ink), width: size })
        const bytes = Uint8Array.from(atob(url.split(",")[1]), (c) => c.charCodeAt(0))
        return { bytes, fileName: `${name}.png`, type: "image/png", summary: `A ${size} × ${size} PNG QR code, ${formatBytes(bytes.length)}.` }
      },
    })

  return (
    <>
      <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[1fr_minmax(0,15rem)]">
        <div className="space-y-4">
          <ChoiceCards
            name="qr-kind"
            label="What goes in the code"
            value={kind}
            onChange={setKind}
            className="grid-cols-3"
            choices={[
              { value: "text", title: "Link or text" },
              { value: "whatsapp", title: "WhatsApp chat" },
              { value: "wifi", title: "Wi-Fi" },
            ]}
          />

          {kind === "text" && (
            <div>
              <label htmlFor="qr-text" className="text-sm font-medium">
                {tool.textLabel}
              </label>
              <Textarea
                id="qr-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={tool.textPlaceholder}
                className="mt-1 min-h-28 resize-y rounded-xl text-base"
              />
            </div>
          )}
          {kind === "whatsapp" && (
            <>
              <div>
                <label htmlFor="qr-phone" className="text-sm font-medium">
                  WhatsApp number
                </label>
                <input id="qr-phone" type="tel" inputMode="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" className={field} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {number.length >= 10 ? `Opens a chat with +${number}` : "Pakistani numbers can start with 0; we add +92 for you."}
                </p>
              </div>
              <div>
                <label htmlFor="qr-message" className="text-sm font-medium">
                  First message <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input id="qr-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Assalam o Alaikum, I saw your card" className={field} />
              </div>
            </>
          )}
          {kind === "wifi" && (
            <>
              <div>
                <label htmlFor="qr-network" className="text-sm font-medium">
                  Network name
                </label>
                <input id="qr-network" autoComplete="off" value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="Home-WiFi" className={field} />
              </div>
              {security !== "nopass" && (
                <div>
                  <label htmlFor="qr-password" className="text-sm font-medium">
                    Wi-Fi password
                  </label>
                  <input id="qr-password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
                </div>
              )}
              <ChoiceCards
                name="qr-security"
                label="Security"
                value={security}
                onChange={setSecurity}
                className="grid-cols-3"
                choices={[
                  { value: "WPA", title: "WPA / WPA2", text: "Most routers" },
                  { value: "WEP", title: "WEP", text: "Old routers" },
                  { value: "nopass", title: "Open", text: "No password" },
                ]}
              />
              <Notice>Guests scan the code and join, without typing the password. It never leaves this page.</Notice>
            </>
          )}

          <div>
            <p className="text-sm font-medium">Colour</p>
            <div className="mt-2 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Colour">
              {inks.map((colour) => (
                <button
                  key={colour}
                  type="button"
                  role="radio"
                  aria-checked={ink === colour}
                  aria-label={colour}
                  onClick={() => setInk(colour)}
                  className={cn(
                    "size-9 rounded-full border-2 outline-none transition-transform hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/40",
                    ink === colour ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                  )}
                  style={{ background: colour }}
                />
              ))}
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="color" value={ink} onChange={(e) => setInk(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border bg-background p-1" aria-label="Pick any colour" />
                Any colour
              </label>
            </div>
            {tooLight && <p className="mt-2 text-xs text-warning">This colour is light. Phones may not be able to read the code; a darker colour is safer.</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ChoiceCards
              name="qr-size"
              label="Size"
              value={size}
              onChange={setSize}
              className="grid-cols-3"
              choices={[
                { value: 256, title: "Small" },
                { value: 512, title: "Medium" },
                { value: 1024, title: "Large" },
              ]}
            />
            <ChoiceCards
              name="qr-format"
              label="File type"
              value={format}
              onChange={setFormat}
              className="grid-cols-2"
              choices={[
                { value: "png", title: "PNG" },
                { value: "svg", title: "SVG" },
              ]}
            />
          </div>
        </div>

        <div className="md:sticky md:top-24 md:self-start">
          <div className="mx-auto flex aspect-square w-full max-w-60 items-center justify-center rounded-2xl border bg-white p-3" aria-live="polite">
            {shown && !shown.error ? (
              // eslint-disable-next-line @next/next/no-img-element -- generated on this page
              <img src={shown.url} alt="Preview of your QR code" className="size-full" />
            ) : (
              <p className="px-4 text-center text-sm text-neutral-500">
                {shown?.error ? "That is too much for one QR code. Use a shorter link or text." : "Your QR code appears here as you type."}
              </p>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">Test it with your phone camera before printing.</p>
        </div>
      </div>
      <WorkspaceFooter tool={tool}>
        <ActionButton ready={ready} onClick={run}>
          {format === "svg" ? "Make SVG" : tool.actionLabel}
        </ActionButton>
      </WorkspaceFooter>
    </>
  )
}

export const QrCodeWorkspace = ({ tool }: { tool: Tool }) => <EditorWorkspace tool={tool} Editor={QrEditor} toJob={asJob} />
