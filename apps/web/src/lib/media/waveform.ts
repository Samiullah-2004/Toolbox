// Reads an audio file and boils it down to a few hundred loudness values, for drawing its wave.

export interface Waveform {
  /** loudest point in each slice of the file, 0 to 1 */
  peaks: Float32Array
  /** seconds */
  duration: number
}

/** Longer or bigger files than this are not decoded: it would need too much memory */
const MAX_BYTES = 150 * 1024 * 1024

export async function readWaveform(file: File, slices = 800): Promise<Waveform> {
  if (file.size > MAX_BYTES) throw new Error("File too big to draw")
  // 8000 samples a second is plenty for a picture, and a one-hour file stays near 100 MB
  const context = new OfflineAudioContext(1, 1, 8000)
  const buffer = await context.decodeAudioData(await file.arrayBuffer())
  const samples = buffer.getChannelData(0)
  const size = Math.max(1, Math.floor(samples.length / slices))

  const peaks = new Float32Array(slices)
  let loudest = 0
  for (let i = 0; i < slices; i++) {
    let peak = 0
    const from = i * size
    for (let j = from; j < Math.min(from + size, samples.length); j++) peak = Math.max(peak, Math.abs(samples[j]))
    peaks[i] = peak
    loudest = Math.max(loudest, peak)
  }
  // quiet recordings still fill the picture
  if (loudest > 0) for (let i = 0; i < slices; i++) peaks[i] /= loudest
  return { peaks, duration: buffer.duration }
}
