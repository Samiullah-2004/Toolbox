const units = ["B", "KB", "MB", "GB"]

/** Rounds first, then picks the unit, so 1,048,500 bytes reads "1.0 MB" and not "1024 KB" */
export function formatBytes(bytes: number) {
  let value = bytes
  let unit = 0
  while (unit < units.length - 1 && (unit === 0 ? value : Math.round(value)) >= 1024) {
    value /= 1024
    unit++
  }
  if (unit === 0) return `${value} B`
  return `${value < 9.95 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}
