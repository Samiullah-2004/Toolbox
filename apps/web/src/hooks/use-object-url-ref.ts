import { useCallback } from "react"

/**
 * Ref callback that points an <audio>, <video> or <img> at a file. The temporary address is
 * released when the element goes away, so nothing leaks, even when React re-runs it in development.
 */
export function useObjectUrlRef<T extends HTMLMediaElement | HTMLImageElement>(source: Blob) {
  return useCallback(
    (element: T | null) => {
      if (!element) return
      const url = URL.createObjectURL(source)
      element.src = url
      return () => URL.revokeObjectURL(url)
    },
    [source]
  )
}
