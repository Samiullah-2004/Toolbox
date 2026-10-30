// Runs ffmpeg (compiled to WebAssembly) in the browser for the audio and video tools.
//
// Every job gets its own Web Worker with its own ffmpeg, which is closed when the job ends.
// That keeps memory clean, and it is what makes Cancel a real stop. The ffmpeg files are
// served by the site itself (see scripts/copy-ffmpeg.mjs), so nothing comes from a CDN.
//
// Input files are mounted, not copied: ffmpeg reads them straight from the user's disk,
// so even a 500 MB video does not need 500 MB of memory first.

/** Messages between this file and workers/ffmpeg.worker.ts */
export interface WorkerRequest {
  id: number
  inputs: { name: string; file: File }[]
  args: string[]
}

export type WorkerResponse =
  | { id: number; progress: number }
  | { id: number; ok: true; code: number; log: string[]; outputs: MediaOutput[] }
  | { id: number; ok: false; log: string[]; message: string }

export interface MediaOutput {
  name: string
  bytes: Uint8Array
}

/** An error whose message is safe to show to the user as it is */
export class MediaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MediaError"
  }
}

export interface MediaRun {
  inputs: File[]
  /** Builds ffmpeg's arguments. `inputs[i]` is where file i can be read, `outDir` is where results go. */
  args: (inputs: string[], outDir: string) => string[]
  signal?: AbortSignal
  /** 0 to 1, when ffmpeg can tell how far along it is */
  onProgress?: (fraction: number) => void
}

/** What ffmpeg says in its log, turned into something a person can act on */
function explain(log: string[]): string {
  const text = log.join("\n")
  if (/Invalid data found|moov atom not found|could not find codec parameters/i.test(text)) {
    return "Toolbox couldn't read this file. It may be damaged, or not a real audio or video file."
  }
  if (/does not contain any stream|matches no streams|Stream specifier .* matches no/i.test(text)) {
    return "There is no sound in this file, so there is nothing to work with."
  }
  if (/Unknown encoder|Encoder .* not found|Unsupported codec/i.test(text)) {
    return "This format isn't supported here. Try another one."
  }
  return "The file couldn't be processed. Try a different setting or another file."
}

const isOutOfMemory = (message: string) => /memory|RangeError|out of bounds|abort\(/i.test(message)

const extensionOf = (name: string) => (/\.[a-z0-9]{1,5}$/i.exec(name)?.[0] ?? "").toLowerCase()

let nextId = 0

function execute(
  inputs: File[],
  makeArgs: (paths: string[], outDir: string) => string[],
  signal?: AbortSignal,
  onProgress?: (fraction: number) => void
): Promise<{ code: number; log: string[]; outputs: MediaOutput[] }> {
  signal?.throwIfAborted()
  const id = nextId++
  const worker = new Worker(new URL("../../workers/ffmpeg.worker.ts", import.meta.url), { type: "module" })

  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener("abort", onAbort)
      worker.terminate()
    }
    const onAbort = () => {
      finish()
      reject(new DOMException("Cancelled", "AbortError"))
    }

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data
      if (data.id !== id) return
      if ("progress" in data) {
        // ffmpeg guesses from the length of the file, and can be off at the very start or end
        if (Number.isFinite(data.progress)) onProgress?.(Math.min(Math.max(data.progress, 0), 1))
        return
      }
      finish()
      if (data.ok) {
        resolve(data)
      } else {
        console.error("ffmpeg worker failed:", data.message, data.log.slice(-8))
        reject(
          new MediaError(
            isOutOfMemory(data.message)
              ? "Your device ran out of memory. Try a smaller file, or a shorter part of it."
              : "The media engine couldn't start. Check your connection and try again."
          )
        )
      }
    }
    worker.onerror = () => {
      finish()
      reject(new MediaError("The media engine couldn't start. Check your connection and try again."))
    }
    signal?.addEventListener("abort", onAbort, { once: true })

    const names = inputs.map((file, i) => `in${i}${extensionOf(file.name)}`)
    const request: WorkerRequest = {
      id,
      inputs: inputs.map((file, i) => ({ name: names[i], file })),
      args: makeArgs(
        names.map((name) => `/in/${name}`),
        "/out"
      ),
    }
    worker.postMessage(request)
  })
}

/** Runs ffmpeg and returns every file it wrote */
export async function runMedia({ inputs, args, signal, onProgress }: MediaRun): Promise<MediaOutput[]> {
  const { code, log, outputs } = await execute(inputs, args, signal, onProgress)
  if (code !== 0 || outputs.length === 0) throw new MediaError(explain(log))
  return outputs
}

export interface MediaInfo {
  /** seconds */
  duration: number | null
  hasVideo: boolean
  hasAudio: boolean
}

/**
 * Asks ffmpeg what is in a file. The browser can usually tell us the length itself, so this is
 * the fallback for formats the browser can't open (some iPhone and camera videos).
 */
export async function probeMedia(file: File, signal?: AbortSignal): Promise<MediaInfo> {
  // no output file: ffmpeg prints what it found in the file, then stops
  const { log } = await execute([file], (paths) => ["-i", paths[0]], signal)
  const text = log.join("\n")
  const time = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(text)
  return {
    duration: time ? Number(time[1]) * 3600 + Number(time[2]) * 60 + Number(time[3]) : null,
    hasVideo: /Stream #.*Video:/.test(text),
    hasAudio: /Stream #.*Audio:/.test(text),
  }
}
