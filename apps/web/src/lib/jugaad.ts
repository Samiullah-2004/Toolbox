// Jugaad Mode: ready-made chains of tools. The result of one step goes straight into the next
// (see file-handoff.ts), and a bar on each tool page shows where you are in the chain.

import { getTool } from "@/lib/tools"

export interface Chain {
  id: string
  title: string
  steps: string[]
}

export const chains: Chain[] = [
  { id: "lecture-voice-note", title: "Lecture video to voice note", steps: ["video-to-mp3", "trim-audio", "whatsapp-voice-note"] },
  { id: "selfie-passport", title: "iPhone selfie to passport photo", steps: ["heic-to-jpg", "remove-background", "passport-photo"] },
  { id: "recording-whatsapp", title: "Screen recording to a WhatsApp video", steps: ["screen-recorder", "trim-video", "compress-video"] },
  { id: "photos-pdf", title: "Phone photos to one small PDF", steps: ["document-scanner", "merge-pdf", "compress-pdf"] },
]

/** Every tool in the chain works already */
export const chainReady = (chain: Chain) => chain.steps.every((slug) => getTool(slug)?.live)
