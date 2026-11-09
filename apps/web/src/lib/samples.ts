// Sample results for tools whose server isn't built yet (Weeks 5-7). The screens are real, so people
// can try every step; at the end they get one of these example files, clearly marked as a sample.

/** Waits like a real job would, with progress, and stops when cancelled */
export async function simulateWork(signal: AbortSignal, onProgress: (fraction: number) => void, ms = 2400) {
  const steps = 24
  for (let i = 1; i <= steps; i++) {
    signal.throwIfAborted()
    await new Promise((resolve) => setTimeout(resolve, ms / steps))
    onProgress(i / steps)
  }
  signal.throwIfAborted()
}

const encode = (text: string) => new TextEncoder().encode(text)
const escapeXml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/* ---------- PDF ---------- */

export interface PdfLine {
  text: string
  size?: number
  bold?: boolean
  /** blacked out, like a redacted detail */
  hidden?: boolean
}

/** A simple A4 PDF with lines of English text (sample PDFs use the built-in fonts, which have no Urdu) */
export async function samplePdf(lines: PdfLine[]) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib")
  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595, 842])
  let y = 780
  for (const line of lines) {
    const size = line.size ?? 12
    const font = line.bold ? bold : regular
    page.drawText(line.text, { x: 56, y, size, font, color: rgb(0.12, 0.14, 0.2) })
    if (line.hidden) {
      page.drawRectangle({ x: 52, y: y - 4, width: font.widthOfTextAtSize(line.text, size) + 8, height: size + 8, color: rgb(0, 0, 0) })
    }
    y -= size * 1.9
  }
  return doc.save()
}

/* ---------- Word (.docx) ---------- */

/** A real Word document: a title and paragraphs. A .docx is a ZIP of a few XML files. */
export async function sampleDocx(title: string, paragraphs: string[]) {
  const { zipSync } = await import("fflate")
  const paragraph = (text: string, heading = false) =>
    `<w:p>${heading ? '<w:pPr><w:pStyle w:val="Title"/></w:pPr>' : ""}<w:r>${heading ? "<w:rPr><w:b/><w:sz w:val=\"36\"/></w:rPr>" : ""}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraph(title, true)}${paragraphs.map((p) => paragraph(p)).join("")}</w:body></w:document>`
  return zipSync({
    "[Content_Types].xml": encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`),
    "_rels/.rels": encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`),
    "word/document.xml": encode(document),
  })
}

/* ---------- Excel (.xlsx) ---------- */

/** A real Excel sheet. Numbers are stored as numbers, everything else as text. */
export async function sampleXlsx(rows: string[][]) {
  const { zipSync } = await import("fflate")
  const column = (i: number) => String.fromCharCode(65 + i)
  const cell = (value: string, ref: string) =>
    /^-?\d+(\.\d+)?$/.test(value)
      ? `<c r="${ref}"><v>${value}</v></c>`
      : `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`
  const sheetRows = rows.map((row, r) => `<row r="${r + 1}">${row.map((value, c) => cell(value, `${column(c)}${r + 1}`)).join("")}</row>`).join("")
  return zipSync({
    "[Content_Types].xml": encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`),
    "_rels/.rels": encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Table 1" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`),
    "xl/worksheets/sheet1.xml": encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`),
  })
}

/* ---------- Subtitles (.srt) ---------- */

export interface Cue {
  start: string
  end: string
  text: string
}

/** "00:00:01,200" style times; SRT wants commas before the milliseconds */
export const srt = (cues: Cue[]) => encode(cues.map((cue, i) => `${i + 1}\n${cue.start} --> ${cue.end}\n${cue.text}\n`).join("\n"))

/* ---------- Audio (.wav) ---------- */

/** A soft two-note chime, as a stand-in for audio a server will make */
export function sampleWav(seconds = 1.6) {
  const rate = 22050
  const count = Math.floor(rate * seconds)
  const bytes = new Uint8Array(44 + count * 2)
  const view = new DataView(bytes.buffer)
  const text = (at: number, value: string) => [...value].forEach((ch, i) => view.setUint8(at + i, ch.charCodeAt(0)))
  text(0, "RIFF")
  view.setUint32(4, 36 + count * 2, true)
  text(8, "WAVEfmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // plain PCM
  view.setUint16(22, 1, true) // one channel
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, "data")
  view.setUint32(40, count * 2, true)
  for (let i = 0; i < count; i++) {
    const t = i / rate
    const note = t < seconds / 2 ? 659.25 : 880 // E5, then A5
    const envelope = Math.exp(-3 * (t % (seconds / 2)))
    view.setInt16(44 + i * 2, Math.round(Math.sin(2 * Math.PI * note * t) * envelope * 9000), true)
  }
  return bytes
}

export const sampleName = (original: string, label: string, extension: string) =>
  `Sample - ${original.replace(/\.[^.]+$/, "") || "file"} (${label}).${extension}`
