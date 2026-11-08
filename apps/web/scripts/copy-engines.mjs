// Copies the big WebAssembly engines from node_modules into public/, so the site serves them itself
// (no CDN, works offline). They are not committed to git; this runs before `dev` and `build`.
//  - ffmpeg.wasm, for the audio and video tools
//  - ONNX Runtime, which runs the background removal model for the image tools

import { cpSync, existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const engines = [
  { from: join(root, "node_modules", "@ffmpeg", "core", "dist", "esm"), to: "ffmpeg", files: ["ffmpeg-core.js", "ffmpeg-core.wasm"] },
  {
    from: join(root, "node_modules", "onnxruntime-web", "dist"),
    to: "ort",
    files: ["ort-wasm-simd-threaded.asyncify.mjs", "ort-wasm-simd-threaded.asyncify.wasm"],
  },
]

for (const engine of engines) {
  if (!existsSync(engine.from)) {
    console.error(`${engine.from} is missing. Run \`npm install\` first.`)
    process.exit(1)
  }
  const out = join(root, "public", engine.to)
  mkdirSync(out, { recursive: true })
  for (const file of engine.files) cpSync(join(engine.from, file), join(out, file))
}
console.log("ffmpeg and ONNX Runtime copied to public/")
