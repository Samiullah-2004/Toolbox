import type { IconName } from "@/lib/icons"

export type CategoryId = "pdf" | "video" | "audio" | "image" | "speech" | "utility"
export type RunsOn = "browser" | "server"
export type FileKind = "pdf" | "image" | "heic" | "video" | "audio" | "subtitle" | "any"
export type InputMode = "files" | "text" | "record"

export interface Category {
  id: CategoryId
  name: string
  /** Label for the navbar */
  shortName: string
  localName: string
  localMeaning: string
  description: string
  icon: IconName
}

export interface Tool {
  slug: string
  name: string
  description: string
  example: string
  category: CategoryId
  runsOn: RunsOn
  icon: IconName
  input: InputMode
  kinds?: FileKind[]
  multiple?: boolean
  actionLabel: string
  /** Label and placeholder for tools that take typed text instead of files */
  textLabel?: string
  textPlaceholder?: string
  /** The tool-specific middle step shown in "How to use" */
  step: string
  keywords: string[]
  /** Build-plan week this tool ships in */
  week: number
  /** The tool works (otherwise its page shows a "still building" banner) */
  live?: boolean
  popular?: boolean
}

export const categories: Category[] = [
  {
    id: "pdf",
    shortName: "PDF",
    name: "PDF & Documents",
    localName: "Kaagaz",
    localMeaning: "Paper",
    description: "Merge, split, sign, compress and convert PDFs and scans.",
    icon: "FileText",
  },
  {
    id: "video",
    shortName: "Video",
    name: "Video",
    localName: "Filmy",
    localMeaning: "Movie style",
    description: "Convert, compress, trim and turn videos into GIFs.",
    icon: "Clapperboard",
  },
  {
    id: "audio",
    shortName: "Audio",
    name: "Audio",
    localName: "Awaaz",
    localMeaning: "Voice",
    description: "Extract, cut, merge and clean up sound.",
    icon: "AudioWaveform",
  },
  {
    id: "image",
    shortName: "Image",
    name: "Image",
    localName: "Tasveer",
    localMeaning: "Picture",
    description: "Convert, compress, resize and make passport photos.",
    icon: "Image",
  },
  {
    id: "speech",
    shortName: "Speech",
    name: "Speech & Subtitles",
    localName: "Bol",
    localMeaning: "Speak",
    description: "Turn speech into text and subtitles, and text into speech.",
    icon: "Speech",
  },
  {
    id: "utility",
    shortName: "Utilities",
    name: "Utilities",
    localName: "Auzaar",
    localMeaning: "Tools",
    description: "Record your screen, share files and make QR codes.",
    icon: "Wrench",
  },
]

export const tools: Tool[] = [
  // PDF & Documents (Kaagaz)
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    description: "Join several PDFs into one file, in the order you choose.",
    example: "CNIC scan + transcript + fee challan become one PDF",
    category: "pdf",
    runsOn: "browser",
    icon: "FileStack",
    input: "files",
    kinds: ["pdf"],
    multiple: true,
    actionLabel: "Merge PDF",
    step: "Drag the files into the order you want.",
    keywords: ["combine", "join", "append", "together", "add pdf"],
    week: 2,
    live: true,
    popular: true,
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    description: "Take out only the pages you need and save them as a new PDF.",
    example: "Keep only pages 3 to 5",
    category: "pdf",
    runsOn: "browser",
    icon: "Scissors",
    input: "files",
    kinds: ["pdf"],
    actionLabel: "Split PDF",
    step: "Pick the pages or page ranges you want to keep.",
    keywords: ["extract pages", "separate", "cut", "pages", "remove pages"],
    week: 2,
    live: true,
  },
  {
    slug: "organize-pdf",
    name: "Reorder & Rotate",
    description: "Drag pages into a new order and turn sideways pages the right way up.",
    example: "Fix a scan that came out upside down",
    category: "pdf",
    runsOn: "browser",
    icon: "RotateCw",
    input: "files",
    kinds: ["pdf"],
    actionLabel: "Save PDF",
    step: "Drag pages to reorder them and tap rotate on any page.",
    keywords: ["organize", "rotate", "reorder", "sort", "upside down", "arrange", "pages"],
    week: 2,
    live: true,
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    description: "Tell us the size you need, like under 2 MB, and we shrink the PDF to fit.",
    example: "A scholarship portal accepts only 2 MB",
    category: "pdf",
    runsOn: "server",
    icon: "Minimize2",
    input: "files",
    kinds: ["pdf"],
    actionLabel: "Compress PDF",
    step: "Choose a target size, for example 2 MB.",
    keywords: ["reduce size", "shrink", "smaller", "2mb", "1mb", "optimize", "kb"],
    week: 6,
    popular: true,
  },
  {
    slug: "sign-pdf",
    name: "Sign PDF",
    description: "Draw your signature and place it anywhere on the page.",
    example: "Sign a contract without printing it",
    category: "pdf",
    runsOn: "browser",
    icon: "PenLine",
    input: "files",
    kinds: ["pdf"],
    actionLabel: "Sign PDF",
    step: "Draw your signature, then drag it into place.",
    keywords: ["signature", "e-sign", "esign", "autograph"],
    week: 2,
    live: true,
  },
  {
    slug: "ocr",
    name: "OCR (Urdu & English)",
    description: "Read the text in scanned papers and photos so you can copy and search it.",
    example: "A scanned bill becomes copyable text",
    category: "pdf",
    runsOn: "server",
    icon: "ScanText",
    input: "files",
    kinds: ["pdf", "image"],
    actionLabel: "Extract text",
    step: "Choose the language: Urdu, English or both.",
    keywords: ["text recognition", "extract text", "scan to text", "urdu", "copy text", "image to text"],
    week: 6,
    popular: true,
  },
  {
    slug: "pdf-to-word",
    name: "PDF to Word",
    description: "Turn a PDF into a Word file you can edit.",
    example: "Edit a PDF someone sent you",
    category: "pdf",
    runsOn: "server",
    icon: "FileText",
    input: "files",
    kinds: ["pdf"],
    actionLabel: "Convert to Word",
    step: "Wait a few seconds while we rebuild the layout.",
    keywords: ["docx", "doc", "editable", "convert", "word"],
    week: 6,
    popular: true,
  },
  {
    slug: "pdf-to-excel",
    name: "Table to Excel",
    description: "Find the tables in a PDF and save them as an Excel sheet.",
    example: "A bank statement becomes a spreadsheet",
    category: "pdf",
    runsOn: "server",
    icon: "Table2",
    input: "files",
    kinds: ["pdf"],
    actionLabel: "Convert to Excel",
    step: "Check the tables we found and pick the ones to keep.",
    keywords: ["xlsx", "spreadsheet", "csv", "bank statement", "table extraction", "excel"],
    week: 6,
  },
  {
    slug: "document-scanner",
    name: "Document Scanner",
    description: "Turn a phone photo of a paper into a clean, straight scan.",
    example: "A photo of your CNIC becomes a neat scan",
    category: "pdf",
    runsOn: "server",
    icon: "ScanLine",
    input: "files",
    kinds: ["image"],
    multiple: true,
    actionLabel: "Scan document",
    step: "Adjust the corners if the crop is not perfect.",
    keywords: ["scan", "camera", "photo to pdf", "crop", "cnic", "camscanner"],
    week: 7,
  },
  {
    slug: "redact",
    name: "Auto-Redact",
    description: "Find and black out private details like CNIC numbers, phone numbers and IBANs.",
    example: "Share a document without showing your CNIC",
    category: "pdf",
    runsOn: "server",
    icon: "EyeOff",
    input: "files",
    kinds: ["pdf", "image"],
    actionLabel: "Redact document",
    step: "Review what we found and choose what to hide.",
    keywords: ["hide", "privacy", "blackout", "censor", "cnic", "phone number", "iban"],
    week: 7,
  },
  {
    slug: "detect-document",
    name: "Document Type Detection",
    description: "Find out what kind of document a file is and get the best next step.",
    example: "Spots an invoice and offers Table to Excel",
    category: "pdf",
    runsOn: "server",
    icon: "FileSearch",
    input: "files",
    kinds: ["pdf", "image"],
    actionLabel: "Detect type",
    step: "See the type we found, like CNIC, invoice or transcript.",
    keywords: ["classify", "identify", "what is this", "invoice", "transcript"],
    week: 7,
  },

  // Video (Filmy)
  {
    slug: "convert-video",
    name: "Video Converter",
    description: "Change a video to MP4, MOV, MKV, WebM or AVI.",
    example: "An iPhone video won't play on Windows, so convert it to MP4",
    category: "video",
    runsOn: "browser",
    icon: "Clapperboard",
    input: "files",
    kinds: ["video"],
    actionLabel: "Convert video",
    step: "Pick the format you need. MP4 plays almost everywhere.",
    keywords: ["mp4", "mov", "mkv", "webm", "avi", "hevc", "h264", "iphone video", "format"],
    week: 3,
    live: true,
    popular: true,
  },
  {
    slug: "compress-video",
    name: "Compress Video",
    description: "Shrink a video to the size you choose, like 16 MB for WhatsApp.",
    example: "Send a long video on WhatsApp under 16 MB",
    category: "video",
    runsOn: "browser",
    icon: "Shrink",
    input: "files",
    kinds: ["video"],
    actionLabel: "Compress video",
    step: "Choose a target size, for example 16 MB.",
    keywords: ["reduce size", "smaller", "whatsapp", "16mb", "shrink"],
    week: 3,
    live: true,
    popular: true,
  },
  {
    slug: "trim-video",
    name: "Trim Video",
    description: "Cut off the start, the end or a part in the middle.",
    example: "Keep only the best 20 seconds",
    category: "video",
    runsOn: "browser",
    icon: "Film",
    input: "files",
    kinds: ["video"],
    actionLabel: "Trim video",
    step: "Drag the handles to choose the part to keep.",
    keywords: ["cut", "crop", "shorten", "clip"],
    week: 3,
    live: true,
  },
  {
    slug: "video-to-gif",
    name: "Video to GIF",
    description: "Turn a short part of a video into a GIF.",
    example: "A funny clip for the group chat",
    category: "video",
    runsOn: "browser",
    icon: "ImagePlay",
    input: "files",
    kinds: ["video"],
    actionLabel: "Make GIF",
    step: "Select up to 15 seconds and pick the size.",
    keywords: ["gif", "animation", "meme"],
    week: 3,
    live: true,
  },
  {
    slug: "extract-frames",
    name: "Extract Frames",
    description: "Save still pictures from any moment in a video.",
    example: "Grab a sharp screenshot of one moment",
    category: "video",
    runsOn: "browser",
    icon: "Images",
    input: "files",
    kinds: ["video"],
    actionLabel: "Extract frames",
    step: "Pause on the moment you want, or pick one frame every few seconds.",
    keywords: ["screenshot", "still", "thumbnail", "jpg from video", "snapshot"],
    week: 3,
    live: true,
  },
  {
    slug: "mute-video",
    name: "Remove Audio",
    description: "Make a silent copy of your video.",
    example: "Share a video without the background talk",
    category: "video",
    runsOn: "browser",
    icon: "VolumeX",
    input: "files",
    kinds: ["video"],
    actionLabel: "Remove audio",
    step: "We strip out the sound and keep the picture exactly as it is.",
    keywords: ["mute", "silent", "no sound", "delete audio"],
    week: 3,
    live: true,
  },

  // Audio (Awaaz)
  {
    slug: "video-to-mp3",
    name: "Video to MP3",
    description: "Take the sound out of a video and save it as an MP3.",
    example: "Save a lecture's audio to listen to later",
    category: "audio",
    runsOn: "browser",
    icon: "FileMusic",
    input: "files",
    kinds: ["video"],
    actionLabel: "Extract MP3",
    step: "Pick the quality. 128 kbps is plenty for voice.",
    keywords: ["extract audio", "mp3", "convert", "sound from video", "audio"],
    week: 3,
    live: true,
    popular: true,
  },
  {
    slug: "trim-audio",
    name: "Trim & Cut Audio",
    description: "See the sound as a wave, then select and cut the parts you don't need.",
    example: "Cut 30 seconds of silence from the start",
    category: "audio",
    runsOn: "browser",
    icon: "AudioWaveform",
    input: "files",
    kinds: ["audio"],
    actionLabel: "Save audio",
    step: "Drag over the wave to select what to keep or cut.",
    keywords: ["cut", "trim", "crop audio", "ringtone", "waveform", "silence"],
    week: 3,
    live: true,
  },
  {
    slug: "merge-audio",
    name: "Merge Audio",
    description: "Join several audio clips into one file.",
    example: "Join three voice notes into one",
    category: "audio",
    runsOn: "browser",
    icon: "Combine",
    input: "files",
    kinds: ["audio"],
    multiple: true,
    actionLabel: "Merge audio",
    step: "Drag the clips into the right order.",
    keywords: ["combine", "join", "concat", "voice notes"],
    week: 3,
    live: true,
  },
  {
    slug: "whatsapp-voice-note",
    name: "WhatsApp Voice Note",
    description: "Save any audio in the format WhatsApp plays as a voice note.",
    example: "Send a clean recording as a voice message",
    category: "audio",
    runsOn: "browser",
    icon: "MessageCircle",
    input: "files",
    kinds: ["audio", "video"],
    actionLabel: "Make voice note",
    step: "We convert it to OGG Opus, the voice note format.",
    keywords: ["whatsapp", "voice note", "ogg", "opus", "voice message"],
    week: 3,
    live: true,
    popular: true,
  },
  {
    slug: "audio-effects",
    name: "Volume, Speed & Fade",
    description: "Make audio louder or quieter, faster or slower, and fade it in or out.",
    example: "Speed up a long lecture",
    category: "audio",
    runsOn: "browser",
    icon: "SlidersHorizontal",
    input: "files",
    kinds: ["audio"],
    actionLabel: "Apply changes",
    step: "Move the sliders and listen to the preview.",
    keywords: ["volume", "louder", "speed", "faster", "slow", "fade", "boost"],
    week: 3,
    live: true,
  },
  {
    slug: "noise-removal",
    name: "Noise Removal",
    description: "Reduce background noise like fans, traffic and hum.",
    example: "Clean a voice note recorded in a noisy room",
    category: "audio",
    runsOn: "server",
    icon: "AudioLines",
    input: "files",
    kinds: ["audio"],
    actionLabel: "Remove noise",
    step: "Choose how strong the clean-up should be.",
    keywords: ["denoise", "background noise", "clean audio", "hiss", "hum"],
    week: 7,
  },

  // Speech & Subtitles (Bol)
  {
    slug: "speech-to-text",
    name: "Speech to Text",
    description: "Write down everything said in an audio or video file.",
    example: "Turn a lecture recording into notes",
    category: "speech",
    runsOn: "server",
    icon: "Speech",
    input: "files",
    kinds: ["audio", "video"],
    actionLabel: "Transcribe",
    step: "Choose the spoken language, or let us detect it.",
    keywords: ["transcribe", "transcription", "notes", "whisper", "dictation", "urdu"],
    week: 7,
    popular: true,
  },
  {
    slug: "subtitles",
    name: "Subtitles (SRT)",
    description: "Create a subtitle file with the right timing for your video.",
    example: "Add subtitles to a YouTube video",
    category: "speech",
    runsOn: "server",
    icon: "Captions",
    input: "files",
    kinds: ["video", "audio"],
    actionLabel: "Make subtitles",
    step: "Check the lines and fix any word you want.",
    keywords: ["srt", "captions", "vtt", "subtitle generator"],
    week: 7,
  },
  {
    slug: "translate-subtitles",
    name: "Translate Subtitles",
    description: "Translate a subtitle file into another language and keep the timing.",
    example: "English subtitles to Urdu",
    category: "speech",
    runsOn: "server",
    icon: "Languages",
    input: "files",
    kinds: ["subtitle"],
    actionLabel: "Translate",
    step: "Pick the language to translate into.",
    keywords: ["translate", "urdu", "english", "srt", "language"],
    week: 7,
  },
  {
    slug: "text-to-speech",
    name: "Text to Speech",
    description: "Type or paste text and get it read aloud as an audio file.",
    example: "Make an audio version of an article",
    category: "speech",
    runsOn: "server",
    icon: "Volume2",
    input: "text",
    actionLabel: "Make audio",
    textLabel: "Text to read aloud",
    textPlaceholder: "Type or paste the text you want to hear...",
    step: "Pick a voice and the reading speed.",
    keywords: ["tts", "read aloud", "voice", "narration"],
    week: 7,
  },

  // Image (Tasveer)
  {
    slug: "heic-to-jpg",
    name: "HEIC to JPG",
    description: "Convert iPhone photos to JPG so every website accepts them.",
    example: "A portal rejects your iPhone photo",
    category: "image",
    runsOn: "browser",
    icon: "FileImage",
    input: "files",
    kinds: ["heic"],
    multiple: true,
    actionLabel: "Convert to JPG",
    step: "We convert all your photos at once.",
    keywords: ["iphone", "heif", "jpeg", "convert", "photo"],
    week: 4,
    popular: true,
  },
  {
    slug: "compress-image",
    name: "Compress Image",
    description: "Make photos smaller in size without losing visible quality.",
    example: "Fit a form's 200 KB upload limit",
    category: "image",
    runsOn: "browser",
    icon: "ImageDown",
    input: "files",
    kinds: ["image"],
    multiple: true,
    actionLabel: "Compress images",
    step: "Choose a target size or a quality level.",
    keywords: ["reduce", "kb", "shrink", "smaller", "jpg", "png", "optimize"],
    week: 4,
    popular: true,
  },
  {
    slug: "resize-image",
    name: "Resize Image",
    description: "Change the width and height of a photo.",
    example: "A profile picture in the right size",
    category: "image",
    runsOn: "browser",
    icon: "Scaling",
    input: "files",
    kinds: ["image"],
    multiple: true,
    actionLabel: "Resize images",
    step: "Type the size in pixels or pick a preset.",
    keywords: ["dimensions", "pixels", "scale", "width", "height"],
    week: 4,
  },
  {
    slug: "remove-background",
    name: "Remove Background",
    description: "Cut out the person or object and remove everything behind it.",
    example: "A clean product photo",
    category: "image",
    runsOn: "browser",
    icon: "Eraser",
    input: "files",
    kinds: ["image"],
    actionLabel: "Remove background",
    step: "We find the subject on our own. Pick a new background if you like.",
    keywords: ["background remover", "transparent", "cut out", "png", "bg"],
    week: 4,
  },
  {
    slug: "passport-photo",
    name: "Passport & CNIC Photo",
    description: "Crop a photo to the official size with a plain background.",
    example: "A photo for forms and applications",
    category: "image",
    runsOn: "browser",
    icon: "SquareUser",
    input: "files",
    kinds: ["image"],
    actionLabel: "Make photo",
    step: "Choose the size: passport, CNIC or visa.",
    keywords: ["passport size", "cnic", "nadra", "id photo", "visa photo", "35x45"],
    week: 4,
    popular: true,
  },

  // Utilities (Auzaar)
  {
    slug: "screen-recorder",
    name: "Screen & Voice Recorder",
    description: "Record your screen or your microphone, right in the browser.",
    example: "Record a quick tutorial",
    category: "utility",
    runsOn: "browser",
    icon: "ScreenShare",
    input: "record",
    actionLabel: "Start recording",
    step: "Choose screen, voice or both, then press record.",
    keywords: ["record", "screen capture", "microphone", "voice recorder", "tutorial"],
    week: 4,
  },
  {
    slug: "share-link",
    name: "Temporary Share Link",
    description: "Get a link to your file that stops working on its own.",
    example: "Send a result to a friend without email",
    category: "utility",
    runsOn: "server",
    icon: "Link2",
    input: "files",
    kinds: ["any"],
    actionLabel: "Create link",
    step: "Choose when the link should expire.",
    keywords: ["share", "link", "send", "transfer", "expire"],
    week: 5,
  },
  {
    slug: "qr-code",
    name: "QR Code Maker",
    description: "Turn a link or any text into a QR code you can download.",
    example: "Put your portfolio link on a business card",
    category: "utility",
    runsOn: "browser",
    icon: "QrCode",
    input: "text",
    actionLabel: "Make QR code",
    textLabel: "Link or text",
    textPlaceholder: "https://your-portfolio.com",
    step: "Pick the size and colour.",
    keywords: ["qr", "barcode", "link", "url"],
    week: 4,
  },
]

/** Platform features that sit alongside the 35 tools, for the 45-feature total */
export const PLATFORM_FEATURE_COUNT = 10

export function getTool(slug: string) {
  return tools.find((t) => t.slug === slug)
}

export function getCategory(id: CategoryId) {
  return categories.find((c) => c.id === id)!
}

export function isCategoryId(id: string): id is CategoryId {
  return categories.some((c) => c.id === id)
}

export function toolsInCategory(id: CategoryId) {
  return tools.filter((t) => t.category === id)
}

export const popularTools = tools.filter((t) => t.popular)

export function relatedTools(tool: Tool, count = 4) {
  const same = tools.filter((t) => t.category === tool.category && t.slug !== tool.slug)
  const others = tools.filter((t) => t.category !== tool.category && t.popular)
  return [...same, ...others].slice(0, count)
}

/* Files */

const kindDetails: Record<
  FileKind,
  { noun: string; formats: string[]; accept: string; extensions: string[]; mimeTypes: string[] }
> = {
  pdf: { noun: "PDF", formats: ["PDF"], accept: ".pdf,application/pdf", extensions: ["pdf"], mimeTypes: ["application/pdf"] },
  image: {
    noun: "image",
    formats: ["JPG", "PNG", "WebP"],
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    extensions: ["jpg", "jpeg", "png", "webp"],
    // Only what the label promises; GIF, SVG, BMP and friends are not accepted
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  heic: {
    noun: "HEIC",
    formats: ["HEIC"],
    accept: ".heic,.heif,image/heic,image/heif",
    extensions: ["heic", "heif"],
    mimeTypes: ["image/heic", "image/heif"],
  },
  video: {
    noun: "video",
    formats: ["MP4", "MOV", "MKV", "WebM", "AVI"],
    accept: "video/*,.mkv,.mov,.avi,.hevc",
    extensions: ["mp4", "mov", "mkv", "webm", "avi", "m4v", "3gp", "hevc"],
    mimeTypes: [],
  },
  audio: {
    noun: "audio",
    formats: ["MP3", "WAV", "M4A", "OGG"],
    accept: "audio/*,.mp3,.wav,.m4a,.ogg,.opus,.aac",
    extensions: ["mp3", "wav", "m4a", "ogg", "opus", "aac", "flac", "weba"],
    mimeTypes: [],
  },
  subtitle: {
    noun: "subtitle",
    formats: ["SRT", "VTT"],
    accept: ".srt,.vtt",
    extensions: ["srt", "vtt"],
    mimeTypes: ["text/vtt"],
  },
  any: { noun: "", formats: [], accept: "", extensions: [], mimeTypes: [] },
}

/** "a, b or c" */
function listWithOr(items: string[]) {
  return items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`
}

export function detectKind(file: File): FileKind | null {
  // A browser-reported audio/video type wins, so an audio-only .webm is audio, not video
  if (file.type.startsWith("audio/")) return "audio"
  if (file.type.startsWith("video/")) return "video"
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  for (const kind of ["pdf", "heic", "image", "video", "audio", "subtitle"] as const) {
    if (kindDetails[kind].extensions.includes(ext)) return kind
  }
  for (const kind of ["pdf", "heic", "image", "subtitle"] as const) {
    if (kindDetails[kind].mimeTypes.includes(file.type)) return kind
  }
  return null
}

/** The file's own format for display, e.g. "PNG" or "MOV" */
export function fileTypeLabel(file: File) {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toUpperCase() : ""
  return ext.length > 0 && ext.length <= 5 ? ext : "File"
}

export function acceptsFile(tool: Tool, file: File) {
  if (!tool.kinds || tool.kinds.includes("any")) return true
  const kind = detectKind(file)
  return kind !== null && tool.kinds.includes(kind)
}

export function acceptAttribute(tool: Tool) {
  return (tool.kinds ?? []).map((k) => kindDetails[k].accept).filter(Boolean).join(",") || undefined
}

/**
 * What a tool accepts, for hints: the exact formats for one kind ("MP3, WAV, M4A or OGG"),
 * or the kinds for several ("Audio or video").
 */
export function acceptLabel(tool: Tool) {
  const kinds = tool.kinds ?? []
  if (kinds.length === 0 || kinds.includes("any")) return "Any file"
  if (kinds.length === 1) return listWithOr(kindDetails[kinds[0]].formats)
  const label = listWithOr(kinds.map((k) => kindDetails[k].noun))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** The file noun for sentences: "Choose your PDF files", "Choose your audio or video file", "Choose your file" */
export function fileNoun(tool: Tool, plural = !!tool.multiple) {
  const kinds = (tool.kinds ?? []).filter((k) => k !== "any")
  const word = plural ? "files" : "file"
  return kinds.length ? `${listWithOr(kinds.map((k) => kindDetails[k].noun))} ${word}` : word
}

/** Server tools are kept small for the free 512 MB server; video runs on the user's device */
export function maxFileSizeMB(tool: Tool) {
  if (tool.runsOn === "server") return 10
  if (tool.kinds?.some((k) => k === "video" || k === "audio")) return 500
  return 100
}

export const SERVER_PAGE_LIMIT = 20

export function hasPageLimit(tool: Tool) {
  return tool.runsOn === "server" && !!tool.kinds?.includes("pdf")
}

/**
 * Tools that take a given file, popular ones first, then tools that take any file
 * (like Temporary Share Link). Used by "drop a file and we suggest tools".
 */
export function suggestToolsForFile(file: File) {
  const kind = detectKind(file)
  const fileTools = tools.filter((t) => t.input === "files")
  const specific = kind
    ? fileTools
        .filter((t) => t.kinds?.includes(kind))
        .sort((a, b) => Number(!!b.popular) - Number(!!a.popular))
    : []
  const anyFile = fileTools.filter((t) => t.kinds?.includes("any"))
  return [...specific, ...anyFile]
}

/* Search */

/** Every word of the query must appear somewhere; name hits rank above keyword hits. Returns 0 for no match. */
export function scoreMatch(name: string, keywords: string[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return 1
  const n = name.toLowerCase()
  const haystack = `${n} ${keywords.join(" ").toLowerCase()}`
  const words = q.split(/\s+/)
  if (!words.every((w) => haystack.includes(w))) return 0
  if (n.startsWith(q)) return 1
  if (n.includes(q)) return 0.8
  if (words.every((w) => n.includes(w))) return 0.6
  return 0.3
}

/** Filter for cmdk lists, where each item's value is the tool name */
export function commandFilter(value: string, search: string, keywords?: string[]) {
  return scoreMatch(value, keywords ?? [], search)
}

export function searchKeywords(tool: Tool) {
  const category = getCategory(tool.category)
  return [
    ...tool.keywords,
    tool.description,
    category.name,
    category.localName,
    tool.runsOn === "browser" ? "on device private offline" : "server",
  ]
}

export function searchTools(query: string) {
  return tools
    .map((tool) => ({ tool, score: scoreMatch(tool.name, searchKeywords(tool), query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.tool)
}
