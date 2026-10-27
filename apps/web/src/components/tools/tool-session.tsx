"use client"

import { createContext, use, useState } from "react"

interface ToolSession {
  files: File[]
  setFiles: React.Dispatch<React.SetStateAction<File[]>>
  text: string
  setText: React.Dispatch<React.SetStateAction<string>>
}

const SessionContext = createContext<ToolSession | null>(null)

/**
 * Holds what the user has put into a tool (files or text), shared by the workspace
 * and the "How to use" steps so the steps can react live to what the user does.
 */
export function ToolSessionProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<File[]>([])
  const [text, setText] = useState("")
  return <SessionContext value={{ files, setFiles, text, setText }}>{children}</SessionContext>
}

export function useToolSession() {
  const session = use(SessionContext)
  if (!session) throw new Error("useToolSession must be used inside <ToolSessionProvider>")
  return session
}
