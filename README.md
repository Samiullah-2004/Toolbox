# Toolbox

**Free PDF, Video, Audio and Image Tools**
_Har kaam ka tool, ek hi box mein_

Toolbox is a free, privacy-friendly website with 35 tools for fixing everyday files: merge and compress PDFs, convert iPhone videos and photos, turn a lecture into a WhatsApp voice note, read Urdu text from scans, and more. It is built for students and everyday users in Pakistan.

Everything is free, with no sign-up or login. Most tools run inside the browser, so files never leave the user's device. Heavier jobs like OCR run on a small Python server, and uploaded files are deleted after 1 hour.

> University semester project by Sami.

## Status

Built in 8 weekly steps. Each tool page shows the week it ships in.

| Week | Focus | Status |
| --- | --- | --- |
| 1 | Website, design system, tool pages, search, drag and drop | Done |
| 2 | PDF tools (Rust + WebAssembly) | Next |
| 3 | Audio and video tools (ffmpeg.wasm) | |
| 4 | Image tools, utilities, Jugaad Mode | |
| 5 | Database, temporary file storage, daily limits (Supabase, Upstash) | |
| 6 | Python server: OCR, PDF to Word, tables | |
| 7 | Python server: scanner, redaction, speech to text | |
| 8 | Deploy and launch | |

## Tech stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- **Browser tools:** Rust/WebAssembly, ffmpeg.wasm, pdf.js
- **Backend:** Python, FastAPI, Tesseract, OpenCV, pdfplumber
- **Data and hosting:** Supabase, Vercel, Render

## Project structure

```
apps/
  web/    Next.js website (Week 1)
```

More apps (the Python API, the Rust PDF module) are added in later weeks.

## Run it locally

Requires Node.js 20 or newer.

```bash
cd apps/web
npm install
npm run dev
```

Then open http://localhost:3000.
