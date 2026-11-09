"use client"

import dynamic from "next/dynamic"
import { getTool, type Tool } from "@/lib/tools"

function WorkspaceLoading() {
  return <div className="h-96 animate-pulse rounded-3xl border bg-card" aria-busy="true" aria-label="Loading tool" />
}

// Every tool has its own workspace, loaded only on its own page. Tools whose server is built
// later (Weeks 5-7) get their real screens now, with a sample result (see server/preview-editors.tsx).
const workspaces: Record<string, React.ComponentType<{ tool: Tool }>> = {
  "merge-pdf": dynamic(() => import("@/components/tools/pdf/merge-workspace").then((mod) => mod.MergeWorkspace), {
    loading: WorkspaceLoading,
  }),
  "split-pdf": dynamic(() => import("@/components/tools/pdf/split-workspace").then((mod) => mod.SplitWorkspace), {
    loading: WorkspaceLoading,
  }),
  "organize-pdf": dynamic(() => import("@/components/tools/pdf/organize-workspace").then((mod) => mod.OrganizeWorkspace), {
    loading: WorkspaceLoading,
  }),
  "sign-pdf": dynamic(() => import("@/components/tools/pdf/sign-workspace").then((mod) => mod.SignWorkspace), {
    loading: WorkspaceLoading,
  }),
  "convert-video": dynamic(() => import("@/components/tools/media/video-editors").then((mod) => mod.ConvertVideoWorkspace), {
    loading: WorkspaceLoading,
  }),
  "compress-video": dynamic(() => import("@/components/tools/media/video-editors").then((mod) => mod.CompressVideoWorkspace), {
    loading: WorkspaceLoading,
  }),
  "trim-video": dynamic(() => import("@/components/tools/media/video-editors").then((mod) => mod.TrimVideoWorkspace), {
    loading: WorkspaceLoading,
  }),
  "video-to-gif": dynamic(() => import("@/components/tools/media/video-editors").then((mod) => mod.VideoToGifWorkspace), {
    loading: WorkspaceLoading,
  }),
  "extract-frames": dynamic(() => import("@/components/tools/media/video-editors").then((mod) => mod.ExtractFramesWorkspace), {
    loading: WorkspaceLoading,
  }),
  "mute-video": dynamic(() => import("@/components/tools/media/video-editors").then((mod) => mod.MuteVideoWorkspace), {
    loading: WorkspaceLoading,
  }),
  "video-to-mp3": dynamic(() => import("@/components/tools/media/audio-editors").then((mod) => mod.VideoToMp3Workspace), {
    loading: WorkspaceLoading,
  }),
  "trim-audio": dynamic(() => import("@/components/tools/media/audio-editors").then((mod) => mod.TrimAudioWorkspace), {
    loading: WorkspaceLoading,
  }),
  "merge-audio": dynamic(() => import("@/components/tools/media/audio-editors").then((mod) => mod.MergeAudioWorkspace), {
    loading: WorkspaceLoading,
  }),
  "whatsapp-voice-note": dynamic(() => import("@/components/tools/media/audio-editors").then((mod) => mod.VoiceNoteWorkspace), {
    loading: WorkspaceLoading,
  }),
  "audio-effects": dynamic(() => import("@/components/tools/media/audio-editors").then((mod) => mod.AudioEffectsWorkspace), {
    loading: WorkspaceLoading,
  }),
  "heic-to-jpg": dynamic(() => import("@/components/tools/image/image-editors").then((mod) => mod.HeicToJpgWorkspace), {
    loading: WorkspaceLoading,
  }),
  "compress-image": dynamic(() => import("@/components/tools/image/image-editors").then((mod) => mod.CompressImageWorkspace), {
    loading: WorkspaceLoading,
  }),
  "resize-image": dynamic(() => import("@/components/tools/image/image-editors").then((mod) => mod.ResizeImageWorkspace), {
    loading: WorkspaceLoading,
  }),
  "remove-background": dynamic(() => import("@/components/tools/image/image-editors").then((mod) => mod.RemoveBackgroundWorkspace), {
    loading: WorkspaceLoading,
  }),
  "passport-photo": dynamic(() => import("@/components/tools/image/passport-editor").then((mod) => mod.PassportPhotoWorkspace), {
    loading: WorkspaceLoading,
  }),
  "screen-recorder": dynamic(() => import("@/components/tools/utility/recorder-editor").then((mod) => mod.RecorderWorkspace), {
    loading: WorkspaceLoading,
  }),
  "qr-code": dynamic(() => import("@/components/tools/utility/qr-editor").then((mod) => mod.QrCodeWorkspace), {
    loading: WorkspaceLoading,
  }),
  "compress-pdf": dynamic(() => import("@/components/tools/server/preview-editors").then((mod) => mod.CompressPdfWorkspace), {
    loading: WorkspaceLoading,
  }),
  "ocr": dynamic(() => import("@/components/tools/server/preview-editors").then((mod) => mod.OcrWorkspace), {
    loading: WorkspaceLoading,
  }),
  "pdf-to-word": dynamic(() => import("@/components/tools/server/preview-editors").then((mod) => mod.PdfToWordWorkspace), {
    loading: WorkspaceLoading,
  }),
  "pdf-to-excel": dynamic(() => import("@/components/tools/server/preview-editors").then((mod) => mod.PdfToExcelWorkspace), {
    loading: WorkspaceLoading,
  }),
  "document-scanner": dynamic(() => import("@/components/tools/server/preview-editors").then((mod) => mod.ScannerWorkspace), {
    loading: WorkspaceLoading,
  }),
  "redact": dynamic(() => import("@/components/tools/server/preview-editors").then((mod) => mod.RedactWorkspace), {
    loading: WorkspaceLoading,
  }),
  "detect-document": dynamic(() => import("@/components/tools/server/preview-editors").then((mod) => mod.DetectWorkspace), {
    loading: WorkspaceLoading,
  }),
  "noise-removal": dynamic(() => import("@/components/tools/server/preview-editors").then((mod) => mod.NoiseWorkspace), {
    loading: WorkspaceLoading,
  }),
  "speech-to-text": dynamic(() => import("@/components/tools/server/preview-editors").then((mod) => mod.SpeechToTextWorkspace), {
    loading: WorkspaceLoading,
  }),
  "subtitles": dynamic(() => import("@/components/tools/server/preview-editors").then((mod) => mod.SubtitlesWorkspace), {
    loading: WorkspaceLoading,
  }),
  "translate-subtitles": dynamic(() => import("@/components/tools/server/preview-editors").then((mod) => mod.TranslateWorkspace), {
    loading: WorkspaceLoading,
  }),
  "text-to-speech": dynamic(() => import("@/components/tools/server/preview-editors").then((mod) => mod.TextToSpeechWorkspace), {
    loading: WorkspaceLoading,
  }),
  "share-link": dynamic(() => import("@/components/tools/server/preview-editors").then((mod) => mod.ShareLinkWorkspace), {
    loading: WorkspaceLoading,
  }),
}

export function ToolWorkspace({ slug }: { slug: string }) {
  const tool = getTool(slug)!
  const Workspace = workspaces[slug]
  return <Workspace tool={tool} />
}
