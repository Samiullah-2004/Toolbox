/** Saves bytes as a file on the user's device */
export function downloadBytes(bytes: Uint8Array, fileName: string, type = "application/pdf") {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the download before releasing the memory
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** "Scholarship form.pdf" + "merged" -> "Scholarship form (merged).pdf" */
export function outputName(original: string, label: string, extension = "pdf") {
  const base = original.replace(/\.[^.]+$/, "") || "document"
  return `${base} (${label}).${extension}`
}
