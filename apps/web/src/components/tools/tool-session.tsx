"use client"

import { createContext, use, useState } from "react"

interface ToolSession {
  files: File[]
  setFiles: React.Dispatch<React.SetStateAction<File[]>>
  text: string
  setText: React.Dispatch<React.SetStateAction<string>>
  /** True once the tool has produced its result */
  finished: boolean
  setFinished: React.Dispatch<React.SetStateAction<boolean>>
}

const SessionContext = createContext<ToolSession | null>(null)

/**
 * Holds what the user has put into a tool (files or text) and whether it is done,
 * shared by the workspace and the "How to use" steps so the steps react live.
 */
export function ToolSessionProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<File[]>([])
  const [text, setText] = useState("")
  const [finished, setFinished] = useState(false)
  return (
    <SessionContext value={{ files, setFiles, text, setText, finished, setFinished }}>{children}</SessionContext>
  )
}

export function useToolSession() {
  const session = use(SessionContext)
  if (!session) throw new Error("useToolSession must be used inside <ToolSessionProvider>")
  return session
}
