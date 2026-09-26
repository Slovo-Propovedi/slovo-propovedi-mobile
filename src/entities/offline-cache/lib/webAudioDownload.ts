import { CacheCancelledError } from './CacheCancelledError'

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
 * @param signal - Optional signal that cancels the download.
 * @returns A response whose body is ready to be written into the audio cache.
 */
export const fetchAudioForCache = async (
  audioUrl: string,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<Response> => {
  onProgress?.(0)

  try {
    const corsResponse = await fetch(audioUrl, { mode: 'cors', signal })
    if (corsResponse.ok) return await readWithProgress(audioUrl, corsResponse, onProgress, signal)
  } catch {
    // A cancelled CORS request must not fall through to the opaque fallback.
    if (signal?.aborted) throw new CacheCancelledError(audioUrl)
    // CORS not allowed by the host — fall through to an opaque response.
  }

  const opaqueResponse = await fetch(audioUrl, { mode: 'no-cors', signal })
  onProgress?.(1)
  return opaqueResponse
}

const readWithProgress = async (
  audioUrl: string,
  response: Response,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<Response> => {
  const totalBytes = Number(response.headers.get('Content-Length')) || 0
  if (!response.body || totalBytes <= 0) {
    onProgress?.(1)
    return response
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let receivedBytes = 0

  for (;;) {
    if (signal?.aborted) throw new CacheCancelledError(audioUrl)
    const { done, value } = await reader.read()
    if (done) break
    // BlobPart requires an ArrayBuffer-backed view; fetch chunks normally are,
    // but a SharedArrayBuffer-backed chunk falls back to a copy.
    if (isArrayBufferBacked(value)) chunks.push(value)
    else chunks.push(new Uint8Array(value))
    receivedBytes += value.length
    onProgress?.(Math.min(1, receivedBytes / totalBytes))
  }
  onProgress?.(1)

  const contentType = response.headers.get('Content-Type') ?? DEFAULT_AUDIO_MIME
  const blob = new Blob(chunks, { type: contentType })
  return new Response(blob, {
    headers: { 'Content-Length': String(blob.size), 'Content-Type': contentType },
  })
}

const isArrayBufferBacked = (value: Uint8Array): value is Uint8Array<ArrayBuffer> =>
  value.buffer instanceof ArrayBuffer
