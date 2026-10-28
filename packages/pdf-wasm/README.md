# pdf-wasm

The Toolbox PDF engine. Written in Rust with [lopdf](https://crates.io/crates/lopdf) and compiled
to WebAssembly, so it runs inside the user's browser and files are never uploaded.

One function does all the page work: `assemble(files, pages)` builds a new PDF from any pages of
any input files, in any order, each with an optional rotation.

| Tool | Pages passed to `assemble` |
| --- | --- |
| Merge PDF | every page of every file |
| Split PDF | the chosen pages of one file |
| Reorder & Rotate | all kept pages of one file, in the new order, with rotations |

`src/ffi.rs` is the small interface JavaScript calls (no wasm-bindgen needed): the request goes
into WebAssembly memory as one buffer and the finished PDF is read back out.

```bash
cargo test                                           # run the tests (on your computer)
cargo build --release --target wasm32-unknown-unknown
```

Or from `apps/web`: `npm run build:wasm` builds it and copies it into `public/wasm/`.
