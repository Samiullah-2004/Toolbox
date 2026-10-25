// Passes dropped files from one page to a tool page during client-side
// navigation, so the user never has to pick the same file twice.
// This is the first building block of Jugaad Mode (chained tools).
//
// It works like a mailbox: a tool page subscribes while it is visible, and
// files waiting for it are delivered once.

type Listener = (files: File[]) => void

let pending: { slug: string; files: File[] } | null = null
const listeners = new Map<string, Listener>()

export function handOffFiles(slug: string, files: File[]) {
  const listener = listeners.get(slug)
  if (listener) listener(files)
  else pending = { slug, files }
}

/** Subscribes a tool page to its files. Anything already waiting is delivered right away. */
export function receiveHandoffs(slug: string, listener: Listener) {
  listeners.set(slug, listener)
  if (pending?.slug === slug) {
    const { files } = pending
    pending = null
    listener(files)
  }
  return () => {
    if (listeners.get(slug) === listener) listeners.delete(slug)
  }
}
