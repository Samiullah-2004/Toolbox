"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { AnimatePresence, m } from "motion/react"
import { Mic, Monitor, MonitorSpeaker, Pause, Play, Square } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { asJob, EditorWorkspace, type EditorProps } from "@/components/tools/editor-workspace"
import { ChoiceCards, Notice } from "@/components/tools/media/media-parts"
import { WorkspaceFooter } from "@/components/tools/workspace-parts"
import { formatBytes } from "@/lib/format"
import { formatTime } from "@/lib/media/commands"
import type { Tool } from "@/lib/tools"

type Source = "screen" | "screen-mic" | "mic"
type Phase = { name: "choose" } | { name: "countdown"; left: number } | { name: "recording"; paused: boolean }

const sources: { value: Source; icon: typeof Mic; title: string; text: string }[] = [
  { value: "screen", icon: Monitor, title: "Screen", text: "A tab, a window or your whole screen" },
  { value: "screen-mic", icon: MonitorSpeaker, title: "Screen and voice", text: "Explain while you show, like a tutorial" },
  { value: "mic", icon: Mic, title: "Voice only", text: "Just your microphone, saved as audio" },
]

/** The best format this browser can record in */
function pickType(video: boolean) {
  const options = video
    ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
    : ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"]
  return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? ""
}

/** What went wrong when asking for the screen or microphone, in words a person can act on */
function permissionProblem(error: unknown, source: Source) {
  const name = error instanceof DOMException ? error.name : ""
  if (name === "NotAllowedError") {
    return source === "mic"
      ? "Toolbox wasn't allowed to use your microphone. Click the lock or microphone icon in the address bar, allow it, and try again."
      : "Recording was cancelled, or the browser wasn't allowed to share your screen. Try again and pick what to share."
  }
  if (name === "NotFoundError") return "No microphone was found. Plug one in, or choose Screen without voice."
  if (name === "NotReadableError") return "Another app is using your microphone or screen. Close it and try again."
  return "Recording couldn't start in this browser. Try the latest Chrome, Edge or Firefox."
}

const canRecordScreen = () => !!navigator.mediaDevices?.getDisplayMedia
const noSubscription = () => () => {}

/** Phones can't record the screen. The server can't know, so it assumes a computer. */
const useScreenSupported = () => useSyncExternalStore(noSubscription, canRecordScreen, () => true)

function RecorderEditor({ tool, onRun }: EditorProps) {
  const screenSupported = useScreenSupported()
  const [chosen, setSource] = useState<Source>("screen")
  const source: Source = screenSupported ? chosen : "mic"
  const [phase, setPhase] = useState<Phase>({ name: "choose" })
  const [problem, setProblem] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0)

  const recorder = useRef<MediaRecorder | null>(null)
  const streams = useRef<MediaStream[]>([])
  const audio = useRef<AudioContext | null>(null)
  const chunks = useRef<Blob[]>([])
  const startedAt = useRef(0)
  const pausedFor = useRef(0)
  const pausedAt = useRef(0)
  const livePreview = useRef<HTMLVideoElement>(null)
  const attempts = useRef(0)

  const release = () => {
    streams.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()))
    streams.current = []
    void audio.current?.close()
    audio.current = null
  }
  // stop everything if the person leaves the page mid-recording
  useEffect(() => () => {
    if (recorder.current?.state !== "inactive") recorder.current?.stop()
    release()
  }, [])

  // the timer, and the microphone level
  useEffect(() => {
    if (phase.name !== "recording" || phase.paused) return
    const timer = setInterval(() => setSeconds((Date.now() - startedAt.current - pausedFor.current) / 1000), 250)
    return () => clearInterval(timer)
  }, [phase])

  const finish = (type: string, video: boolean) => {
    release()
    const blob = new Blob(chunks.current, { type: type.split(";")[0] })
    chunks.current = []
    const length = (Date.now() - startedAt.current - pausedFor.current) / 1000
    setPhase({ name: "choose" })
    if (blob.size === 0) {
      setProblem("Nothing was recorded. Try again, and record for at least a second.")
      return
    }
    const extension = blob.type.includes("mp4") ? (video ? "mp4" : "m4a") : blob.type.includes("ogg") ? "ogg" : "webm"
    const stamp = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).replace(",", "").replace(":", ".")
    onRun({
      working: "Saving your recording",
      run: async () => ({
        bytes: new Uint8Array(await blob.arrayBuffer()),
        fileName: `${video ? "Screen recording" : "Voice recording"} ${stamp}.${extension}`,
        type: blob.type,
        summary: `${formatTime(length, false)} recorded, ${formatBytes(blob.size)}.`,
      }),
    })
  }

  const begin = async () => {
    setProblem(null)
    // each Start is its own attempt; Cancel or a newer Start makes an older attempt give up
    const attempt = ++attempts.current
    const outdated = () => attempts.current !== attempt
    const wantsScreen = source !== "mic"
    const wantsMic = source !== "screen"
    try {
      // kept in streams.current as soon as each is granted, so a later refusal still stops it
      const parts: MediaStream[] = []
      streams.current = parts
      if (wantsScreen) parts.push(await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true }))
      if (wantsMic) parts.push(await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }))
      if (outdated()) {
        parts.forEach((stream) => stream.getTracks().forEach((track) => track.stop()))
        return
      }

      // put every sound (the screen's and the microphone's) into one track
      const context = new AudioContext()
      audio.current = context
      const mixer = context.createMediaStreamDestination()
      const meter = context.createAnalyser()
      meter.fftSize = 512
      for (const stream of parts) {
        if (stream.getAudioTracks().length === 0) continue
        const input = context.createMediaStreamSource(stream)
        input.connect(mixer)
        input.connect(meter)
      }
      const tracks = [...(wantsScreen ? parts[0].getVideoTracks() : []), ...mixer.stream.getAudioTracks()]
      const combined = new MediaStream(tracks)

      // stopping from the browser's own "Stop sharing" bar ends the recording too
      parts[0].getVideoTracks()[0]?.addEventListener("ended", () => {
        if (recorder.current?.state !== "inactive") recorder.current?.stop()
      })

      const type = pickType(wantsScreen)
      const media = new MediaRecorder(combined, type ? { mimeType: type } : undefined)
      media.ondataavailable = (event) => event.data.size > 0 && chunks.current.push(event.data)
      media.onstop = () => finish(media.mimeType || type, wantsScreen)
      recorder.current = media

      if (livePreview.current && wantsScreen) livePreview.current.srcObject = parts[0]

      // a short countdown, so you can get ready before it starts
      for (let left = 3; left > 0; left--) {
        setPhase({ name: "countdown", left })
        await new Promise((resolve) => setTimeout(resolve, 800))
        if (outdated()) return // cancelled during the countdown
      }
      const samples = new Uint8Array(meter.fftSize)
      const tick = () => {
        if (!audio.current) return
        meter.getByteTimeDomainData(samples)
        let peak = 0
        for (const sample of samples) peak = Math.max(peak, Math.abs(sample - 128))
        setLevel(peak / 128)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)

      chunks.current = []
      startedAt.current = Date.now()
      pausedFor.current = 0
      setSeconds(0)
      media.start(1000)
      setPhase({ name: "recording", paused: false })
    } catch (error) {
      if (outdated()) return
      release()
      setPhase({ name: "choose" })
      setProblem(permissionProblem(error, source))
    }
  }

  const togglePause = () => {
    const media = recorder.current
    if (!media || phase.name !== "recording") return
    if (phase.paused) {
      pausedFor.current += Date.now() - pausedAt.current
      media.resume()
    } else {
      pausedAt.current = Date.now()
      media.pause()
    }
    setPhase({ name: "recording", paused: !phase.paused })
  }

  const stop = () => {
    if (phase.name === "countdown") {
      attempts.current++ // the countdown in progress gives up
      release()
      setPhase({ name: "choose" })
      return
    }
    if (phase.name === "recording" && phase.paused) pausedFor.current += Date.now() - pausedAt.current
    recorder.current?.stop()
  }

  const busy = phase.name !== "choose"
  const showsScreen = source !== "mic"

  return (
    <>
      <div className="space-y-4 p-4 sm:p-6">
        <ChoiceCards
          name="recorder-source"
          label="What to record"
          value={source}
          onChange={setSource}
          className="sm:grid-cols-3 sm:gap-3"
          choices={sources.map((choice) => ({ ...choice, disabled: busy || (choice.value !== "mic" && !screenSupported) }))}
        />
        {!screenSupported && <Notice>Screen recording works on computers. On this device you can record your voice.</Notice>}

        <div className="relative flex min-h-56 flex-col items-center justify-center overflow-hidden rounded-2xl border bg-muted/40 p-6 text-center">
          {showsScreen && (
            <video ref={livePreview} autoPlay muted playsInline className={cn("absolute inset-0 size-full object-contain opacity-0 transition-opacity", busy && "opacity-30")} />
          )}
          <AnimatePresence mode="wait" initial={false}>
            {phase.name === "countdown" ? (
              <m.p
                key={`count-${phase.left}`}
                initial={{ scale: 1.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className="relative font-heading text-7xl font-bold tabular-nums"
                aria-live="assertive"
              >
                {phase.left}
              </m.p>
            ) : phase.name === "recording" ? (
              <m.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative space-y-4">
                <p className="flex items-center justify-center gap-2 text-sm font-semibold">
                  <span className={cn("size-3 rounded-full bg-destructive", !phase.paused && "animate-pulse")} aria-hidden="true" />
                  {phase.paused ? "Paused" : "Recording"}
                </p>
                <p className="font-heading text-5xl font-bold tabular-nums" role="timer" aria-label="Recording time">
                  {formatTime(seconds, false)}
                </p>
                {source !== "screen" && (
                  <div className="mx-auto flex h-6 w-48 items-end justify-center gap-1" aria-hidden="true">
                    {Array.from({ length: 12 }, (_, i) => (
                      <span
                        key={i}
                        className={cn("w-2 rounded-full transition-[height] duration-75", level * 12 > i ? "bg-success" : "bg-muted-foreground/20")}
                        style={{ height: `${30 + i * 6}%` }}
                      />
                    ))}
                  </div>
                )}
              </m.div>
            ) : (
              <m.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative space-y-2">
                <p className="font-heading text-lg font-semibold">Ready when you are</p>
                <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                  {showsScreen
                    ? "Press Start, choose what to share, and recording begins after a 3-second countdown."
                    : "Press Start and allow the microphone. Recording begins after a 3-second countdown."}
                </p>
              </m.div>
            )}
          </AnimatePresence>
        </div>
        {problem && <Notice tone="error">{problem}</Notice>}
        <Notice>The recording stays on your device. Nothing is uploaded.</Notice>
      </div>

      <WorkspaceFooter tool={tool}>
        {busy ? (
          <>
            {phase.name === "recording" && (
              <Button variant="outline" size="lg" onClick={togglePause}>
                {phase.paused ? <Play /> : <Pause />}
                {phase.paused ? "Resume" : "Pause"}
              </Button>
            )}
            <Button size="lg" variant="destructive" onClick={stop} className="flex-1 sm:flex-none">
              <Square />
              {phase.name === "countdown" ? "Cancel" : "Stop and save"}
            </Button>
          </>
        ) : (
          <Button size="lg" onClick={begin} className="w-full sm:w-auto">
            <span className="size-2.5 rounded-full bg-current" aria-hidden="true" />
            {tool.actionLabel}
          </Button>
        )}
      </WorkspaceFooter>
    </>
  )
}

export const RecorderWorkspace = ({ tool }: { tool: Tool }) => (
  <EditorWorkspace
    tool={tool}
    Editor={RecorderEditor}
    toJob={asJob}
    next={(result) =>
      result.type?.startsWith("video/")
        ? ["convert-video", "trim-video", "compress-video", "video-to-mp3"]
        : ["trim-audio", "whatsapp-voice-note", "audio-effects", "merge-audio"]
    }
  />
)
