// Copies ffmpeg.wasm into public/ffmpeg, so the site serves it itself (no CDN, works offline).
// The 31 MB core is not committed to git; this runs before `dev` and `build`.

import { cpSync, existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const out = join(root, "public", "ffmpeg")
const core = join(root, "node_modules", "@ffmpeg", "core", "dist", "esm")

if (!existsSync(core)) {
  console.error("ffmpeg packages are missing. Run `npm install` first.")
  process.exit(1)
}

mkdirSync(out, { recursive: true })
for (const file of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) cpSync(join(core, file), join(out, file))
console.log("ffmpeg core copied to public/ffmpeg")
