// The ffmpeg Web Worker: runs ffmpeg (WebAssembly) off the main thread, so the page stays smooth.
// One job per worker (see lib/media/ffmpeg.ts): load, read the files, run, send results, done.

import type { WorkerRequest, WorkerResponse } from "@/lib/media/ffmpeg"

/** The parts of ffmpeg-core that we use */
interface FFmpegCore {
  FS: {
    mkdir(path: string): void
    mount(type: unknown, options: unknown, mountPoint: string): void
    filesystems: Record<string, unknown>
    readdir(path: string): string[]
    stat(path: string): { mode: number }
    isDir(mode: number): boolean
    readFile(path: string): Uint8Array
  }
  setLogger(callback: (data: { type: string; message: string }) => void): void
  setProgress(callback: (data: { progress: number; time: number }) => void): void
  setTimeout(ms: number): void
  exec(...args: string[]): void
  ret: number
  reset(): void
}

const post = (message: WorkerResponse, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(message, transfer)

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, inputs, args } = event.data
  const log: string[] = []
  try {
    // The core is a plain file served by the site; the bundler must leave this import alone
    const coreURL = `${self.location.origin}/ffmpeg/ffmpeg-core.js`
    const { default: createFFmpegCore } = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ coreURL)) as {
      default: (options: { mainScriptUrlOrBlob: string }) => Promise<FFmpegCore>
    }
    const wasmURL = coreURL.replace(/\.js$/, ".wasm")
    const core = await createFFmpegCore({
      mainScriptUrlOrBlob: `${coreURL}#${btoa(JSON.stringify({ wasmURL, workerURL: coreURL.replace(/\.js$/, ".worker.js") }))}`,
    })
    core.setLogger(({ message }) => {
      log.push(message)
      if (log.length > 300) log.shift()
    })
    core.setProgress(({ progress }) => post({ id, progress }))

    // Mount the user's files instead of copying them into memory
    core.FS.mkdir("/in")
    core.FS.mkdir("/out")
    core.FS.mount(core.FS.filesystems.WORKERFS, { blobs: inputs.map(({ name, file }) => ({ name, data: file })) }, "/in")

    core.setTimeout(-1)
    core.exec(...args)
    const code = core.ret
    core.reset()

    const outputs = core.FS.readdir("/out")
      .filter((name) => name !== "." && name !== ".." && !core.FS.isDir(core.FS.stat(`/out/${name}`).mode))
      .map((name) => ({ name, bytes: core.FS.readFile(`/out/${name}`) }))
    post({ id, ok: true, code, log, outputs }, outputs.map((output) => output.bytes.buffer as ArrayBuffer))
  } catch (error) {
    post({ id, ok: false, log, message: error instanceof Error ? error.message : String(error) })
  }
}
