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
| 2 | PDF tools: merge, split, reorder and rotate, sign (Rust + WebAssembly) | Done |
| 3 | Audio and video tools (ffmpeg.wasm) | Done |
| 4 | Image tools, utilities, Jugaad Mode | Next |
| 5 | Database, temporary file storage, daily limits (Supabase, Upstash) | |
| 6 | Python server: OCR, PDF to Word, tables | |
| 7 | Python server: scanner, redaction, speech to text | |
| 8 | Deploy and launch | |

## Tech stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- **Browser tools:** Rust/WebAssembly (lopdf), ffmpeg.wasm (@ffmpeg/core), pdf.js, pdf-lib, dnd-kit, signature_pad, Web Workers
- **Backend:** Python, FastAPI, Tesseract, OpenCV, pdfplumber
- **Data and hosting:** Supabase, Vercel, Render

## Project structure

```
apps/
  web/          Next.js website
packages/
  pdf-wasm/     Rust PDF engine, compiled to WebAssembly
docs/           HCI interaction plan
```

The Python API is added in Week 6.

## How the PDF tools work

Merge, Split and Reorder & Rotate run on a small Rust engine (`packages/pdf-wasm`) compiled to
WebAssembly. It runs in a Web Worker inside the browser, so files are never uploaded and the page
stays smooth. pdf.js draws the page previews, and pdf-lib stamps signatures for Sign PDF.

```
Browser tab ──> Web Worker ──> pdf_wasm.wasm (Rust + lopdf)
   ▲   pdf.js previews             merge / split / reorder / rotate
   └── download the result, or send it to the next tool (Jugaad Mode)
```

## Run it locally

Requires Node.js 20 or newer.

```bash
cd apps/web
npm install
npm run dev
```

Then open http://localhost:3000.

The compiled engine (`apps/web/public/wasm/pdf_wasm.wasm`) is committed, so Rust is not needed to
run the website. To change the Rust code, install [Rust](https://rustup.rs) with the
`wasm32-unknown-unknown` target, then:

```bash
cd packages/pdf-wasm && cargo test      # Rust tests
cd apps/web && npm run build:wasm       # rebuild and copy the .wasm into the website
```
