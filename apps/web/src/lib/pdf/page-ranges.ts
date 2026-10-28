/**
 * Reads what people type for pages: "1-3, 5, 8-" -> [1, 2, 3, 5, 8, 9, 10] (for a 10-page file).
 * Forgiving on purpose: spaces, en dashes and "to" are fine; pages past the end are ignored.
 * Returns null if something can't be understood, so the field can show a hint.
 */
export function parsePageRanges(input: string, pageCount: number): number[] | null {
  const pages = new Set<number>()
  const parts = input
    .replace(/[–—]|\bto\b/gi, "-")
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  for (const part of parts) {
    const match = /^(\d*)\s*(-?)\s*(\d*)$/.exec(part)
    if (!match || (!match[1] && !match[3])) return null
    const [, startText, dash, endText] = match
    const start = startText ? Number(startText) : 1
    const end = dash ? (endText ? Number(endText) : pageCount) : start
    if (start < 1 || end < start) return null
    for (let page = start; page <= Math.min(end, pageCount); page++) pages.add(page)
  }
  return [...pages].sort((a, b) => a - b)
}

/** The other direction: [1, 2, 3, 5] -> "1-3, 5" */
export function formatPageRanges(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b)
  const ranges: string[] = []
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i]
    while (sorted[i + 1] === sorted[i] + 1) i++
    ranges.push(start === sorted[i] ? String(start) : `${start}-${sorted[i]}`)
  }
  return ranges.join(", ")
}
