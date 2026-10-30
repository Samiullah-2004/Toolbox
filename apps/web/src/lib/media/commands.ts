// What to tell ffmpeg for each tool. Pure functions: file paths in, argument lists out.

/* ---------- Time ---------- */

/** 75.5 -> "1:15.5", 3725 -> "1:02:05" */
export function formatTime(seconds: number, tenths = true) {
  const safe = Math.max(0, seconds)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const rest = safe % 60
  const secondsText = tenths ? rest.toFixed(1).padStart(4, "0") : String(Math.floor(rest)).padStart(2, "0")
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${secondsText}` : `${minutes}:${secondsText}`
}

/** "12", "1:05", "1:05.5" or "0:01:05" -> seconds. Returns null when it isn't a time. */
export function parseTime(text: string): number | null {
  const parts = text.trim().split(":")
  if (parts.length > 3 || parts.some((part) => !/^\d+(\.\d+)?$/.test(part))) return null
  return parts.reduce((total, part) => total * 60 + Number(part), 0)
}

/** For file names and ffmpeg: 12.3456 -> "12.346" */
const sec = (value: number) => value.toFixed(3)

/* ---------- Video ---------- */

export type VideoFormat = "mp4" | "webm" | "mov" | "mkv" | "avi"

export const videoFormats: { id: VideoFormat; label: string; note: string }[] = [
  { id: "mp4", label: "MP4", note: "Plays almost everywhere" },
  { id: "webm", label: "WebM", note: "Small, for websites" },
  { id: "mov", label: "MOV", note: "Apple and editing apps" },
  { id: "mkv", label: "MKV", note: "Many tracks in one file" },
  { id: "avi", label: "AVI", note: "Old players and TVs" },
]

/** Even width and height, which H.264 needs */
const EVEN = "scale=trunc(iw/2)*2:trunc(ih/2)*2"

export function convertVideoArgs(input: string, output: string, format: VideoFormat) {
  switch (format) {
    case "webm":
      // VP8 and Vorbis: the newer VP9 and Opus encoders crash in the WebAssembly build of ffmpeg
      return ["-i", input, "-vf", EVEN, "-c:v", "libvpx", "-deadline", "realtime", "-cpu-used", "5", "-crf", "10", "-b:v", "3M", "-c:a", "libvorbis", "-q:a", "4", output]
    case "avi":
      return ["-i", input, "-vf", EVEN, "-c:v", "mpeg4", "-q:v", "4", "-c:a", "libmp3lame", "-b:a", "160k", output]
    default: // mp4, mov and mkv all take H.264 and AAC
      return ["-i", input, "-vf", EVEN, "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", ...(format === "mp4" ? ["-movflags", "+faststart"] : []), output]
  }
}

const AUDIO_BITS = 96_000

/** How tall the picture can be for a given bitrate, so a small target doesn't turn into mush */
function heightFor(videoBitsPerSecond: number) {
  if (videoBitsPerSecond >= 2_500_000) return 1080
  if (videoBitsPerSecond >= 1_000_000) return 720
  if (videoBitsPerSecond >= 450_000) return 480
  return 360
}

/** What fits in `targetBytes`: the bitrate for the picture, and how tall the picture can be */
export function compressSettings(targetBytes: number, durationSeconds: number) {
  const total = (targetBytes * 8 * 0.94) / Math.max(durationSeconds, 1) // 6% room for the container
  const room = total - AUDIO_BITS
  const videoBits = Math.max(Math.floor(room), 60_000)
  return { videoBits, height: heightFor(videoBits), veryTight: room < 150_000 }
}

/** Aims for a file of about `targetBytes` */
export function compressVideoArgs(input: string, output: string, targetBytes: number, durationSeconds: number) {
  const { videoBits, height } = compressSettings(targetBytes, durationSeconds)
  return [
    "-i", input,
    "-vf", `scale=-2:'min(${height},ih)'`,
    "-c:v", "libx264", "-preset", "veryfast",
    "-b:v", String(videoBits), "-maxrate", String(Math.floor(videoBits * 1.4)), "-bufsize", String(videoBits * 2),
    "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", String(AUDIO_BITS),
    "-movflags", "+faststart",
    output,
  ]
}

/** Fast: cut without re-encoding (instant, but may start a moment early). Exact: re-encode to MP4. */
export function trimVideoArgs(input: string, output: string, start: number, end: number, exact: boolean) {
  const cut = ["-ss", sec(start), "-i", input, "-t", sec(end - start)]
  return exact
    ? [...cut, "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p", "-vf", EVEN, "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", output]
    : [...cut, "-c", "copy", "-avoid_negative_ts", "make_zero", output]
}

export function videoToGifArgs(input: string, output: string, start: number, end: number, width: number, fps: number) {
  const filter = `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4`
  return ["-ss", sec(start), "-t", sec(end - start), "-i", input, "-vf", filter, "-loop", "0", output]
}

export type ImageFormat = "jpg" | "png"
// ffmpeg's default JPEG mode ("optimal" tables) crashes the WebAssembly build, so ask for the plain mode
const imageOptions = (format: ImageFormat) => (format === "jpg" ? ["-huffman", "default", "-q:v", "2"] : [])

/** One picture at a moment */
export function frameAtArgs(input: string, output: string, at: number, format: ImageFormat) {
  return ["-ss", sec(at), "-i", input, "-frames:v", "1", ...imageOptions(format), output]
}

/** A picture every `every` seconds. `outDir` gets frame-001, frame-002 ... */
export function framesEveryArgs(input: string, outDir: string, every: number, format: ImageFormat) {
  return ["-i", input, "-vf", `fps=1/${every}`, ...imageOptions(format), `${outDir}/frame-%03d.${format}`]
}

/** Copies the picture as it is and drops the sound, so it is instant and loses no quality */
export function muteVideoArgs(input: string, output: string) {
  return ["-i", input, "-c:v", "copy", "-an", output]
}

/* ---------- Audio ---------- */

export type AudioFormat = "mp3" | "m4a" | "wav" | "ogg"

export const audioFormats: { id: AudioFormat; label: string; note: string; codec: string[] }[] = [
  { id: "mp3", label: "MP3", note: "Works everywhere", codec: ["-c:a", "libmp3lame", "-b:a", "192k"] },
  { id: "m4a", label: "M4A", note: "Apple, good quality", codec: ["-c:a", "aac", "-b:a", "192k"] },
  { id: "wav", label: "WAV", note: "Uncompressed, big", codec: ["-c:a", "pcm_s16le"] },
  // Vorbis, because the Opus encoder crashes on stereo in the WebAssembly build of ffmpeg
  { id: "ogg", label: "OGG", note: "Small, open format", codec: ["-c:a", "libvorbis", "-q:a", "4"] },
]

const codecOf = (format: AudioFormat) => audioFormats.find((f) => f.id === format)!.codec

/** Keeps the format the file already has, where we can write it */
export function defaultAudioFormat(fileName: string): AudioFormat {
  const ext = /\.([a-z0-9]+)$/i.exec(fileName)?.[1].toLowerCase()
  if (ext === "m4a" || ext === "aac") return "m4a"
  if (ext === "wav") return "wav"
  if (ext === "ogg" || ext === "opus") return "ogg"
  return "mp3"
}

export function videoToMp3Args(input: string, output: string, kbps: number) {
  return ["-i", input, "-vn", "-map", "0:a:0", "-c:a", "libmp3lame", "-b:a", `${kbps}k`, output]
}

/** Keep the part between start and end */
export function keepAudioArgs(input: string, output: string, start: number, end: number, format: AudioFormat) {
  return ["-ss", sec(start), "-t", sec(end - start), "-i", input, "-vn", ...codecOf(format), output]
}

/** Remove the part between start and end, joining what is left on both sides */
export function cutAudioArgs(input: string, output: string, start: number, end: number, format: AudioFormat) {
  const filter = `aselect='not(between(t,${sec(start)},${sec(end)}))',asetpts=N/SR/TB`
  return ["-i", input, "-vn", "-af", filter, ...codecOf(format), output]
}

/** Joins clips one after another. Every clip is first brought to the same sample rate and channels. */
export function mergeAudioArgs(inputs: string[], output: string, format: AudioFormat) {
  const prepare = inputs.map((_, i) => `[${i}:a]aresample=44100,aformat=channel_layouts=stereo[a${i}]`).join(";")
  const join = `${inputs.map((_, i) => `[a${i}]`).join("")}concat=n=${inputs.length}:v=0:a=1[out]`
  return [...inputs.flatMap((input) => ["-i", input]), "-filter_complex", `${prepare};${join}`, "-map", "[out]", ...codecOf(format), output]
}

/** Mono Opus in an OGG file: small, and what WhatsApp uses for voice notes */
export function voiceNoteArgs(input: string, output: string) {
  return ["-i", input, "-vn", "-map", "0:a:0", "-map_metadata", "-1", "-c:a", "libopus", "-b:a", "32k", "-ar", "48000", "-ac", "1", "-application", "voip", output]
}

export interface AudioEffects {
  /** 1 = as it is */
  volume: number
  /** 1 = as it is, from 0.5 to 2 */
  speed: number
  fadeIn: number
  fadeOut: number
}

export const noEffects: AudioEffects = { volume: 1, speed: 1, fadeIn: 0, fadeOut: 0 }

export const hasEffects = (e: AudioEffects) => e.volume !== 1 || e.speed !== 1 || e.fadeIn > 0 || e.fadeOut > 0

export function audioEffectsArgs(input: string, output: string, effects: AudioEffects, durationSeconds: number, format: AudioFormat) {
  const filters: string[] = []
  if (effects.speed !== 1) filters.push(`atempo=${effects.speed}`)
  if (effects.volume !== 1) filters.push(`volume=${effects.volume}`)
  if (effects.fadeIn > 0) filters.push(`afade=t=in:st=0:d=${effects.fadeIn}`)
  if (effects.fadeOut > 0) {
    const length = durationSeconds / effects.speed // the fade comes after the speed change
    filters.push(`afade=t=out:st=${sec(Math.max(0, length - effects.fadeOut))}:d=${effects.fadeOut}`)
  }
  return ["-i", input, "-vn", ...(filters.length ? ["-af", filters.join(",")] : []), ...codecOf(format), output]
}
