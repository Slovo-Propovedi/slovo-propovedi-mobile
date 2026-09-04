const DEFAULT_AUDIO_MIME = 'audio/mpeg'

/**
 * Fetch an audio file so it can be stored for offline playback.
 *
 * A CORS request is tried first: it yields a readable body, so download
 * progress (from `Content-Length`) and an accurate cached size are available.
 * Hosts without CORS headers fall back to an opaque `no-cors` response — it
 * still plays back offline through the service worker, but progress can only
 * jump 0 → 1 and the size is unknown.
 * @param audioUrl - Absolute URL of the audio file to download.
 * @param onProgress - Optional callback receiving download progress as a 0..1 fraction.
 * @returns A response whose body is ready to be written into the audio cache.
 */
export const fetchAudioForCache = async (
  audioUrl: string,
  onProgress?: (progress: number) => void,
): Promise<Response> => {
  onProgress?.(0)

  try {
    const corsResponse = await fetch(audioUrl, { mode: 'cors' })
    if (corsResponse.ok) return await readWithProgress(corsResponse, onProgress)
  } catch {
    // CORS not allowed by the host — fall through to an opaque response.
  }

  const opaqueResponse = await fetch(audioUrl, { mode: 'no-cors' })
  onProgress?.(1)
  return opaqueResponse
}

const readWithProgress = async (
  response: Response,
  onProgress?: (progress: number) => void,
): Promise<Response> => {
  const totalBytes = Number(response.headers.get('Content-Length')) || 0
  if (!response.body || totalBytes <= 0) {
    onProgress?.(1)
    return response
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let receivedBytes = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    receivedBytes += value.length
    onProgress?.(Math.min(1, receivedBytes / totalBytes))
  }
  onProgress?.(1)

  const contentType = response.headers.get('Content-Type') ?? DEFAULT_AUDIO_MIME
  const blob = new Blob(chunks as BlobPart[], { type: contentType })
  return new Response(blob, {
    headers: { 'Content-Length': String(blob.size), 'Content-Type': contentType },
  })
}
