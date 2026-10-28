"use client"

import { useEffect, useState } from "react"
import { openPdf } from "@/lib/pdf/pdfjs"

export type PdfInfo = { status: "loading" } | { status: "ready"; pages: number } | { status: "error"; reason: "password" | "invalid" }

/** Page count (or the reason it can't be read) for each PDF, looked up as files are added */
export function usePdfInfo(files: File[]) {
  const [info, setInfo] = useState(() => new Map<File, PdfInfo>())

  useEffect(() => {
    let cancelled = false
    for (const file of files) {
      if (info.has(file)) continue
      openPdf(file)
        .then((doc) => ({ status: "ready", pages: doc.numPages }) as const)
        .catch((error: Error) => ({ status: "error", reason: error.message === "password" ? "password" : "invalid" }) as const)
        .then((result) => {
          if (!cancelled) setInfo((current) => new Map(current).set(file, result))
        })
    }
    return () => {
      cancelled = true
    }
  }, [files, info])

  return (file: File): PdfInfo => info.get(file) ?? { status: "loading" }
}

export function pdfProblem(info: PdfInfo) {
  if (info.status !== "error") return null
  return info.reason === "password"
    ? "This PDF is protected with a password. Remove the password first."
    : "This file doesn't look like a valid PDF, or it is damaged."
}
