// Builds the Rust PDF engine (packages/pdf-wasm) to WebAssembly and copies it into public/,
// where the browser loads it from. The .wasm file is committed, so building the website
// itself does not need Rust installed; run this only after changing the Rust code.
//
//   npm run build:wasm
import { execFileSync } from "node:child_process"
import { copyFileSync, mkdirSync, statSync } from "node:fs"
import { homedir } from "node:os"
import { delimiter, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const crate = join(webRoot, "..", "..", "packages", "pdf-wasm")
const built = join(crate, "target", "wasm32-unknown-unknown", "release", "pdf_wasm.wasm")
const target = join(webRoot, "public", "wasm", "pdf_wasm.wasm")

// rustup installs cargo here; add it in case it is not on PATH yet
const env = { ...process.env, PATH: [join(homedir(), ".cargo", "bin"), process.env.PATH].join(delimiter) }

execFileSync("cargo", ["build", "--release", "--target", "wasm32-unknown-unknown"], {
  cwd: crate,
  env,
  stdio: "inherit",
})
mkdirSync(dirname(target), { recursive: true })
copyFileSync(built, target)
console.log(`Copied pdf_wasm.wasm (${Math.round(statSync(target).size / 1024)} KB) to public/wasm/`)
