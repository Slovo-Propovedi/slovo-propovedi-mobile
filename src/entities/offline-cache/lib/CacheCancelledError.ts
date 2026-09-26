/**
 * Thrown when an audio download is cancelled (via `cancelAudioDownload` or an
 * external AbortSignal). The retry loop must never re-attempt a cancelled URL,
 * so this error type is checked before every retry decision.
 */
export class CacheCancelledError extends Error {
  public constructor(audioUrl: string) {
    super(`Скачивание отменено: ${audioUrl}`)
    this.name = 'CacheCancelledError'
  }
}

export const isCacheCancelledError = (error: unknown): boolean =>
  error instanceof CacheCancelledError
