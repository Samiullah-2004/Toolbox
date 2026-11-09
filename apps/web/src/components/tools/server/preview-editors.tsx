"use client"

// Screens for the tools whose server is built in Weeks 5-7. Every step works (choosing a file,
// the settings, progress, Cancel, the result) so the tools can be tried and tested now. Nothing is
// uploaded; at the end people get a clearly marked sample of the result, never their own file.

import { useState } from "react"
import { Plus, RefreshCw, Volume2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { asJob, EditorWorkspace, type EditorProps, type Job } from "@/components/tools/editor-workspace"
import { ChoiceCards, Notice, SliderField } from "@/components/tools/media/media-parts"
import { useToolSession } from "@/components/tools/tool-session"
import { ActionButton, fileKey, WorkspaceFooter, type ResultView } from "@/components/tools/workspace-parts"
import { FileThumb } from "@/components/upload/file-thumb"
import { formatBytes } from "@/lib/format"
import { sampleDocx, sampleName, samplePdf, sampleWav, sampleXlsx, simulateWork, srt, type Cue } from "@/lib/samples"
import { fileTypeLabel, type Tool } from "@/lib/tools"

const MB = 1024 * 1024

/** A sample job: waits like the real tool, then hands back an example result */
function sampleJob(
  tool: Tool,
  working: string,
  make: () => Promise<{ bytes: Uint8Array; fileName: string; type: string; summary: string; view?: ResultView }>
): Job {
  return {
    working,
    run: async (signal, onProgress) => {
      await simulateWork(signal, onProgress)
      return { ...(await make()), sample: { week: tool.week } }
    },
  }
}

/** The frame every preview tool shares: the choices, then the action. The page above says it is a preview. */
function Shell({ tool, children, action }: { tool: Tool; children: React.ReactNode; action: React.ReactNode }) {
  return (
    <>
      <div className="space-y-4 p-4 sm:p-6">{children}</div>
      <WorkspaceFooter tool={tool}>{action}</WorkspaceFooter>
    </>
  )
}

/** The chosen files, with a way to replace them or add more */
function Files({ tool, files, setFiles, chooseFiles }: Pick<EditorProps, "tool" | "files" | "setFiles" | "chooseFiles">) {
  return (
    <div className="space-y-2">
      {files.map((file, i) => (
        <div key={fileKey(file)} className="flex items-center gap-3 rounded-2xl border bg-background p-2">
          <FileThumb file={file} className="size-12" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {fileTypeLabel(file)} &middot; {formatBytes(file.size)}
            </p>
          </div>
          {tool.multiple ? (
            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((_, at) => at !== i))}>
              <X />
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={chooseFiles}>
              <RefreshCw />
              Replace
            </Button>
          )}
        </div>
      ))}
      {tool.multiple && (
        <Button variant="outline" size="sm" onClick={chooseFiles}>
          <Plus />
          Add more
        </Button>
      )}
    </div>
  )
}

/* ---------- PDF and documents (Week 6) ---------- */

function CompressPdfEditor(props: EditorProps) {
  const { tool, files, onRun } = props
  const file = files[0]
  const [targetMB, setTargetMB] = useState(2)
  const alreadySmall = file.size <= targetMB * MB
  const estimate = Math.min(targetMB * MB * 0.92, file.size * 0.45)

  const run = () =>
    onRun(
      sampleJob(tool, `Shrinking to under ${targetMB} MB`, async () => ({
        bytes: await samplePdf([
          { text: "Sample result: Compress PDF", size: 20, bold: true },
          { text: `Your file: ${file.name} (${formatBytes(file.size)})` },
          { text: `You asked for: under ${targetMB} MB` },
          { text: "The real tool keeps every page and all the text, and makes" },
          { text: "the pictures inside smaller until the file fits." },
        ]),
        fileName: sampleName(file.name, `under ${targetMB} MB`, "pdf"),
        type: "application/pdf",
        summary: `Your ${formatBytes(file.size)} PDF would come out at about ${formatBytes(estimate)}, with every page kept.`,
        view: {
          kind: "facts",
          title: "What the real tool will do",
          items: [
            { label: "Your file", value: formatBytes(file.size) },
            { label: "Size you asked for", value: `under ${targetMB} MB` },
            { label: "Expected result", value: `about ${formatBytes(estimate)}` },
            { label: "Pages and text", value: "all kept" },
          ],
        },
      }))
    )

  return (
    <Shell tool={tool} action={<ActionButton ready={!alreadySmall} onClick={run}>{tool.actionLabel}</ActionButton>}>
      <Files {...props} />
      <ChoiceCards
        name="pdf-target"
        label="Make it smaller than"
        value={targetMB}
        onChange={setTargetMB}
        className="grid-cols-2 sm:grid-cols-4"
        choices={[
          { value: 1, title: "1 MB", text: "Strict portals" },
          { value: 2, title: "2 MB", text: "Most online forms" },
          { value: 5, title: "5 MB", text: "Email attachment" },
          { value: 10, title: "10 MB", text: "Light clean-up" },
        ]}
      />
      {alreadySmall && <Notice tone="warning">This PDF is already under {targetMB} MB. Choose a smaller size.</Notice>}
    </Shell>
  )
}

const ocrSamples = {
  urdu: "فیس واؤچر\nطالب علم کا نام: محمد علی\nرول نمبر: ۲۰۲۴-ایس ای-۰۴۱\nکل رقم: ۲۵,۰۰۰ روپے\nآخری تاریخ: ۱۵ نومبر",
  english: "FEE CHALLAN\nStudent name: Muhammad Ali\nRoll number: 2024-SE-041\nTotal amount: Rs 25,000\nDue date: 15 November",
}

function OcrEditor(props: EditorProps) {
  const { tool, files, onRun } = props
  const file = files[0]
  const [language, setLanguage] = useState<"urdu" | "english" | "both">("both")
  const text = language === "both" ? `${ocrSamples.urdu}\n\n${ocrSamples.english}` : ocrSamples[language]

  const run = () =>
    onRun(
      sampleJob(tool, "Reading the text", async () => ({
        bytes: new TextEncoder().encode(text),
        fileName: sampleName(file.name, "text", "txt"),
        type: "text/plain",
        summary: "This is how the text from a scanned fee challan comes out. Copy it, or save it as a text file.",
        view: { kind: "text", text },
      }))
    )

  return (
    <Shell tool={tool} action={<ActionButton ready onClick={run}>{tool.actionLabel}</ActionButton>}>
      <Files {...props} />
      <ChoiceCards
        name="ocr-language"
        label="Language of the text"
        value={language}
        onChange={setLanguage}
        className="grid-cols-3"
        choices={[
          { value: "urdu", title: "Urdu", text: "اردو" },
          { value: "english", title: "English" },
          { value: "both", title: "Both", text: "Mixed papers" },
        ]}
      />
      <Notice>Clear, straight photos give the best results. Use Document Scanner first for a crooked phone photo.</Notice>
    </Shell>
  )
}

function PdfToWordEditor(props: EditorProps) {
  const { tool, files, onRun } = props
  const file = files[0]
  const [layout, setLayout] = useState<"keep" | "text">("keep")
  const paragraphs = [
    "Assignment 3: Human-Computer Interaction",
    "This Word file shows how a PDF comes out once the server is ready: headings, paragraphs and lists you can edit.",
    layout === "keep"
      ? "With Keep the layout, columns, tables and pictures stay where they were in the PDF."
      : "With Just the text, you get clean paragraphs that are easy to copy into your own document.",
  ]

  const run = () =>
    onRun(
      sampleJob(tool, "Rebuilding the layout", async () => ({
        bytes: await sampleDocx("Sample result: PDF to Word", paragraphs),
        fileName: sampleName(file.name, "Word", "docx"),
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        summary: "A Word file you can open and edit in Word, Google Docs or WPS.",
        view: { kind: "text", text: paragraphs.join("\n\n") },
      }))
    )

  return (
    <Shell tool={tool} action={<ActionButton ready onClick={run}>{tool.actionLabel}</ActionButton>}>
      <Files {...props} />
      <ChoiceCards
        name="word-layout"
        label="What to keep"
        value={layout}
        onChange={setLayout}
        className="sm:grid-cols-2"
        choices={[
          { value: "keep", title: "Keep the layout", text: "Looks like the PDF: columns, tables, pictures" },
          { value: "text", title: "Just the text", text: "Clean paragraphs, easy to edit" },
        ]}
      />
    </Shell>
  )
}

const marksTable = [
  ["Roll no.", "Name", "Quiz", "Mid", "Final", "Total"],
  ["041", "Muhammad Ali", "8", "21", "38", "67"],
  ["042", "Ayesha Khan", "9", "24", "41", "74"],
  ["043", "Hamza Riaz", "7", "19", "35", "61"],
  ["044", "Fatima Noor", "10", "26", "44", "80"],
]

function PdfToExcelEditor(props: EditorProps) {
  const { tool, files, onRun } = props
  const file = files[0]
  const [sheets, setSheets] = useState<"one" | "each">("one")

  const run = () =>
    onRun(
      sampleJob(tool, "Finding the tables", async () => ({
        bytes: await sampleXlsx(marksTable),
        fileName: sampleName(file.name, "tables", "xlsx"),
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        summary: "A marks sheet found in a PDF, as an Excel table with real numbers you can add up.",
        view: { kind: "table", rows: marksTable },
      }))
    )

  return (
    <Shell tool={tool} action={<ActionButton ready onClick={run}>{tool.actionLabel}</ActionButton>}>
      <Files {...props} />
      <ChoiceCards
        name="excel-sheets"
        label="If there are several tables"
        value={sheets}
        onChange={setSheets}
        className="sm:grid-cols-2"
        choices={[
          { value: "one", title: "All in one sheet", text: "One under the other" },
          { value: "each", title: "A sheet for each", text: "Easier to sort and filter" },
        ]}
      />
      <Notice>After reading the PDF, the finished tool shows every table it found so you can pick the ones to keep.</Notice>
    </Shell>
  )
}

/* ---------- Smart document tools (Week 7) ---------- */

function ScannerEditor(props: EditorProps) {
  const { tool, files, onRun } = props
  const [look, setLook] = useState<"colour" | "grey" | "bw">("bw")
  const lookName = { colour: "colour", grey: "grey", bw: "black and white" }[look]

  const run = () =>
    onRun(
      sampleJob(tool, files.length === 1 ? "Straightening your photo" : `Straightening ${files.length} photos`, async () => ({
        bytes: await samplePdf([
          { text: "Sample result: Document Scanner", size: 20, bold: true },
          { text: `${files.length} ${files.length === 1 ? "photo" : "photos"} in, one PDF out, in ${lookName}.` },
          { text: "The real tool finds the paper's edges, straightens it," },
          { text: "removes shadows and makes the text sharp, like a real scanner." },
        ]),
        fileName: sampleName(files[0].name, "scan", "pdf"),
        type: "application/pdf",
        summary: `${files.length} ${files.length === 1 ? "page" : "pages"}, straightened and cleaned, in one PDF.`,
        view: {
          kind: "facts",
          title: "What the real tool will do",
          items: [
            { label: "Pages", value: String(files.length) },
            { label: "Look", value: lookName },
            { label: "Edges", value: "found and straightened" },
            { label: "Shadows", value: "removed" },
          ],
        },
      }))
    )

  return (
    <Shell tool={tool} action={<ActionButton ready={files.length > 0} onClick={run}>{tool.actionLabel}</ActionButton>}>
      <Files {...props} />
      <ChoiceCards
        name="scan-look"
        label="Look"
        value={look}
        onChange={setLook}
        className="grid-cols-3"
        choices={[
          { value: "bw", title: "Black and white", text: "Sharpest text" },
          { value: "grey", title: "Grey", text: "Soft and clear" },
          { value: "colour", title: "Colour", text: "Stamps and photos" },
        ]}
      />
      <Notice>The finished tool shows the corners it found on each photo, and you can drag them if the crop is off.</Notice>
    </Shell>
  )
}

const privateDetails = [
  { id: "cnic", label: "CNIC numbers", example: "CNIC: 35202-1234567-1" },
  { id: "phone", label: "Phone numbers", example: "Phone: 0300-1234567" },
  { id: "iban", label: "Bank accounts (IBAN)", example: "IBAN: PK36SCBL0000001123456702" },
  { id: "email", label: "Email addresses", example: "Email: ali.khan@example.com" },
]

function RedactEditor(props: EditorProps) {
  const { tool, files, onRun } = props
  const file = files[0]
  const [hide, setHide] = useState(() => new Set(["cnic", "phone", "iban"]))
  const toggle = (id: string) =>
    setHide((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const run = () =>
    onRun(
      sampleJob(tool, "Looking for private details", async () => ({
        bytes: await samplePdf([
          { text: "Sample result: Auto-Redact", size: 20, bold: true },
          { text: "Admission form" , bold: true },
          { text: "Name: Muhammad Ali" },
          ...privateDetails.map((detail) => ({ text: detail.example, hidden: hide.has(detail.id) })),
          { text: "Program: BS Software Engineering" },
        ]),
        fileName: sampleName(file.name, "redacted", "pdf"),
        type: "application/pdf",
        summary: `${hide.size} kinds of private detail blacked out for good: they can't be copied or uncovered.`,
        view: {
          kind: "facts",
          title: "Found and hidden",
          items: privateDetails.map((detail) => ({ label: detail.label, value: hide.has(detail.id) ? "hidden" : "kept" })),
        },
      }))
    )

  return (
    <Shell tool={tool} action={<ActionButton ready={hide.size > 0} onClick={run}>{tool.actionLabel}</ActionButton>}>
      <Files {...props} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium">What to hide</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {privateDetails.map((detail) => (
            <label key={detail.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm transition-colors hover:border-foreground/25 has-[:checked]:border-primary has-[:checked]:bg-primary/[0.06]">
              <input type="checkbox" checked={hide.has(detail.id)} onChange={() => toggle(detail.id)} className="size-4 accent-primary" />
              <span>
                <span className="block font-semibold">{detail.label}</span>
                <span className="block text-xs text-muted-foreground">{detail.example.split(": ")[1]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {hide.size === 0 && <Notice tone="warning">Choose at least one kind of detail to hide.</Notice>}
    </Shell>
  )
}

function DetectEditor(props: EditorProps) {
  const { tool, files, onRun } = props
  const file = files[0]
  const isPdf = /pdf$/i.test(file.name) || file.type === "application/pdf"

  const run = () =>
    onRun(
      sampleJob(tool, "Looking at your document", async () => {
        const facts = isPdf
          ? { type: "Fee challan", sure: "93%", next: "PDF to Excel, to get the amounts" }
          : { type: "CNIC (front side)", sure: "96%", next: "Auto-Redact, before you share it" }
        return {
          bytes: new TextEncoder().encode(`Document type: ${facts.type}\nHow sure: ${facts.sure}\nGood next step: ${facts.next}\n`),
          fileName: sampleName(file.name, "type", "txt"),
          type: "text/plain",
          summary: `It looks like a ${facts.type.toLowerCase()}. The finished tool also suggests the best next step.`,
          view: {
            kind: "facts",
            title: facts.type,
            items: [
              { label: "How sure", value: facts.sure },
              { label: "Good next step", value: facts.next },
            ],
          },
        }
      })
    )

  return (
    <Shell tool={tool} action={<ActionButton ready onClick={run}>{tool.actionLabel}</ActionButton>}>
      <Files {...props} />
      <Notice>It recognises CNICs, passports, degrees, transcripts, invoices, fee challans and bank statements.</Notice>
    </Shell>
  )
}

/* ---------- Audio and speech (Week 7) ---------- */

function NoiseEditor(props: EditorProps) {
  const { tool, files, onRun } = props
  const file = files[0]
  const [strength, setStrength] = useState<"light" | "medium" | "strong">("medium")

  const run = () =>
    onRun(
      sampleJob(tool, "Cleaning the sound", async () => ({
        bytes: sampleWav(),
        fileName: sampleName(file.name, "clean", "wav"),
        type: "audio/wav",
        summary: `A ${strength} clean-up: fans, traffic and hum are reduced, voices stay clear. This sample is a short chime.`,
      }))
    )

  return (
    <Shell tool={tool} action={<ActionButton ready onClick={run}>{tool.actionLabel}</ActionButton>}>
      <Files {...props} />
      <ChoiceCards
        name="noise-strength"
        label="How strong"
        value={strength}
        onChange={setStrength}
        className="grid-cols-3"
        choices={[
          { value: "light", title: "Light", text: "Keeps the room sound" },
          { value: "medium", title: "Medium", text: "Best for most voices" },
          { value: "strong", title: "Strong", text: "Very noisy places" },
        ]}
      />
    </Shell>
  )
}

const transcript: Cue[] = [
  { start: "00:00:00,500", end: "00:00:03,200", text: "Assalam o Alaikum, aaj hum HCI ke baare mein baat karenge." },
  { start: "00:00:03,400", end: "00:00:06,900", text: "Today's topic is usability testing with real users." },
  { start: "00:00:07,100", end: "00:00:10,600", text: "Pehle hum dekhenge ke users task kaise complete karte hain." },
]

function SpeechToTextEditor(props: EditorProps) {
  const { tool, files, onRun } = props
  const file = files[0]
  const [language, setLanguage] = useState<"auto" | "urdu" | "english">("auto")
  const [times, setTimes] = useState(true)
  const text = transcript.map((cue) => (times ? `[${cue.start.slice(3, 8)}] ${cue.text}` : cue.text)).join("\n")

  const run = () =>
    onRun(
      sampleJob(tool, "Listening and writing", async () => ({
        bytes: new TextEncoder().encode(text),
        fileName: sampleName(file.name, "transcript", "txt"),
        type: "text/plain",
        summary: "A lecture that mixes Urdu and English, written down. Copy it or save it as a text file.",
        view: { kind: "text", text },
      }))
    )

  return (
    <Shell tool={tool} action={<ActionButton ready onClick={run}>{tool.actionLabel}</ActionButton>}>
      <Files {...props} />
      <ChoiceCards
        name="stt-language"
        label="Spoken language"
        value={language}
        onChange={setLanguage}
        className="grid-cols-3"
        choices={[
          { value: "auto", title: "Find it for me", text: "Also mixed Urdu and English" },
          { value: "urdu", title: "Urdu" },
          { value: "english", title: "English" },
        ]}
      />
      <ChoiceCards
        name="stt-times"
        label="Times"
        value={times ? "yes" : "no"}
        onChange={(value) => setTimes(value === "yes")}
        className="sm:grid-cols-2"
        choices={[
          { value: "yes", title: "With times", text: "[00:03] at the start of each line" },
          { value: "no", title: "Just the words", text: "Easy to copy into notes" },
        ]}
      />
    </Shell>
  )
}

function SubtitlesEditor(props: EditorProps) {
  const { tool, files, onRun } = props
  const file = files[0]
  const [length, setLength] = useState<"short" | "normal">("short")

  const run = () =>
    onRun(
      sampleJob(tool, "Writing the subtitles", async () => ({
        bytes: srt(transcript),
        fileName: sampleName(file.name, "subtitles", "srt"),
        type: "application/x-subrip",
        summary: "An SRT file that YouTube, VLC and most video apps can use. Each line shows at the right moment.",
        view: { kind: "cues", cues: transcript },
      }))
    )

  return (
    <Shell tool={tool} action={<ActionButton ready onClick={run}>{tool.actionLabel}</ActionButton>}>
      <Files {...props} />
      <ChoiceCards
        name="subtitle-length"
        label="Line length"
        value={length}
        onChange={setLength}
        className="sm:grid-cols-2"
        choices={[
          { value: "short", title: "Short lines", text: "Easy to read on phones" },
          { value: "normal", title: "Normal lines", text: "For laptops and TVs" },
        ]}
      />
      <Notice>The finished tool lets you check each line and fix any word before saving.</Notice>
    </Shell>
  )
}

const translations: Record<string, string[]> = {
  urdu: ["السلام علیکم، آج ہم ایچ سی آئی کے بارے میں بات کریں گے۔", "آج کا موضوع اصل صارفین کے ساتھ استعمال کی جانچ ہے۔", "پہلے ہم دیکھیں گے کہ صارفین کام کیسے مکمل کرتے ہیں۔"],
  english: ["Peace be upon you, today we will talk about HCI.", "Today's topic is usability testing with real users.", "First we will see how users complete a task."],
  arabic: ["السلام عليكم، اليوم سنتحدث عن التفاعل بين الإنسان والحاسوب.", "موضوع اليوم هو اختبار قابلية الاستخدام مع مستخدمين حقيقيين.", "أولاً سنرى كيف يكمل المستخدمون مهمة."],
}

function TranslateEditor(props: EditorProps) {
  const { tool, files, onRun } = props
  const file = files[0]
  const [language, setLanguage] = useState<"urdu" | "english" | "arabic">("urdu")
  const cues = transcript.map((cue, i) => ({ ...cue, text: translations[language][i] }))

  const run = () =>
    onRun(
      sampleJob(tool, "Translating", async () => ({
        bytes: srt(cues),
        fileName: sampleName(file.name, language, "srt"),
        type: "application/x-subrip",
        summary: "Every line translated, with the same timing as your file.",
        view: { kind: "cues", cues },
      }))
    )

  return (
    <Shell tool={tool} action={<ActionButton ready onClick={run}>{tool.actionLabel}</ActionButton>}>
      <Files {...props} />
      <ChoiceCards
        name="translate-to"
        label="Translate into"
        value={language}
        onChange={setLanguage}
        className="grid-cols-3"
        choices={[
          { value: "urdu", title: "Urdu", text: "اردو" },
          { value: "english", title: "English" },
          { value: "arabic", title: "Arabic", text: "العربية" },
        ]}
      />
    </Shell>
  )
}

function TextToSpeechEditor({ tool, onRun }: EditorProps) {
  const { text, setText } = useToolSession()
  const [voice, setVoice] = useState<"ur-female" | "ur-male" | "en-female" | "en-male">("ur-female")
  const [speed, setSpeed] = useState(1)
  const urdu = voice.startsWith("ur")

  // The browser's own voice can read the text right now, as a taste of the finished tool
  const listen = () => {
    speechSynthesis.cancel()
    const speech = new SpeechSynthesisUtterance(text)
    speech.lang = urdu ? "ur-PK" : "en-GB"
    speech.rate = speed
    speechSynthesis.speak(speech)
  }

  const run = () =>
    onRun(
      sampleJob(tool, "Recording the voice", async () => ({
        bytes: sampleWav(),
        fileName: `Sample - text to speech (${voice}).wav`,
        type: "audio/wav",
        summary: `${text.trim().split(/\s+/).length} words read aloud by a natural ${urdu ? "Urdu" : "English"} voice. This sample is a short chime.`,
      }))
    )

  return (
    <Shell
      tool={tool}
      action={
        <>
          <Button variant="outline" size="lg" onClick={listen} disabled={!text.trim()}>
            <Volume2 />
            Listen now
          </Button>
          <ActionButton ready={text.trim().length > 0} onClick={run}>
            {tool.actionLabel}
          </ActionButton>
        </>
      }
    >
      <div>
        <label htmlFor="tts-text" className="text-sm font-medium">
          {tool.textLabel}
        </label>
        <Textarea
          id="tts-text"
          dir="auto"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={tool.textPlaceholder}
          className="mt-1 min-h-32 resize-y rounded-xl text-base"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground tabular-nums">{text.length} characters</p>
      </div>
      <ChoiceCards
        name="tts-voice"
        label="Voice"
        value={voice}
        onChange={setVoice}
        className="grid-cols-2 sm:grid-cols-4"
        choices={[
          { value: "ur-female", title: "Urdu, female" },
          { value: "ur-male", title: "Urdu, male" },
          { value: "en-female", title: "English, female" },
          { value: "en-male", title: "English, male" },
        ]}
      />
      <SliderField id="tts-speed" label="Speed" value={speed} min={0.5} max={1.5} step={0.1} display={`${speed.toFixed(1)}×`} onChange={setSpeed} />
      <Notice>&ldquo;Listen now&rdquo; uses your browser&apos;s own voice, which may not speak Urdu. The finished tool uses natural voices.</Notice>
    </Shell>
  )
}

/* ---------- Temporary share link (Week 5) ---------- */

function ShareLinkEditor(props: EditorProps) {
  const { tool, files, onRun } = props
  const file = files[0]
  const [expiry, setExpiry] = useState<"1h" | "1d" | "7d">("1d")
  const [once, setOnce] = useState(false)
  const expiryText = { "1h": "1 hour", "1d": "1 day", "7d": "7 days" }[expiry]

  const run = () =>
    onRun(
      sampleJob(tool, "Making your link", async () => {
        const url = "https://toolbox.pk/s/sample"
        return {
          bytes: new TextEncoder().encode(`${url}\nStops working after ${expiryText}${once ? ", or after one download" : ""}.\n`),
          fileName: sampleName(file.name, "link", "txt"),
          type: "text/plain",
          summary: `A link to ${file.name} that stops working after ${expiryText}${once ? " or the first download" : ""}. Then the file is deleted.`,
          view: { kind: "link", url, note: "Sample link: it doesn't open anything yet. Real links arrive in Week 5." },
        }
      })
    )

  return (
    <Shell tool={tool} action={<ActionButton ready onClick={run}>{tool.actionLabel}</ActionButton>}>
      <Files {...props} />
      <ChoiceCards
        name="share-expiry"
        label="The link stops working after"
        value={expiry}
        onChange={setExpiry}
        className="grid-cols-3"
        choices={[
          { value: "1h", title: "1 hour" },
          { value: "1d", title: "1 day" },
          { value: "7d", title: "7 days" },
        ]}
      />
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/[0.06]">
        <input type="checkbox" checked={once} onChange={(event) => setOnce(event.target.checked)} className="size-4 accent-primary" />
        <span>
          <span className="block font-semibold">Only one download</span>
          <span className="block text-xs text-muted-foreground">The link stops working after it is used once</span>
        </span>
      </label>
    </Shell>
  )
}

/* ---------- Exports, one per tool page ---------- */

const preview = (Editor: React.ComponentType<EditorProps>) =>
  function PreviewWorkspace({ tool }: { tool: Tool }) {
    return <EditorWorkspace tool={tool} Editor={Editor} toJob={asJob} />
  }

export const CompressPdfWorkspace = preview(CompressPdfEditor)
export const OcrWorkspace = preview(OcrEditor)
export const PdfToWordWorkspace = preview(PdfToWordEditor)
export const PdfToExcelWorkspace = preview(PdfToExcelEditor)
export const ScannerWorkspace = preview(ScannerEditor)
export const RedactWorkspace = preview(RedactEditor)
export const DetectWorkspace = preview(DetectEditor)
export const NoiseWorkspace = preview(NoiseEditor)
export const SpeechToTextWorkspace = preview(SpeechToTextEditor)
export const SubtitlesWorkspace = preview(SubtitlesEditor)
export const TranslateWorkspace = preview(TranslateEditor)
export const TextToSpeechWorkspace = preview(TextToSpeechEditor)
export const ShareLinkWorkspace = preview(ShareLinkEditor)
