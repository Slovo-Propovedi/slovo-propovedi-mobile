import { File } from 'expo-file-system'
import { DOWNLOAD_STALL_TIMEOUT_MS, STALL_CHECK_INTERVAL_MS } from './downloadRetryPolicy'

interface DownloadAttemptParams {
  /** Throttled progress callback; raw ticks update the activity timestamp before forwarding. */
  onProgressTick?: (data: RawProgress) => void
  tempFile: File
  url: string
}

interface RawProgress {
  bytesWritten: number
  totalBytes: number
}

/**
 * Runs a single download attempt with a stall guard: an interval aborts the
 * request when no progress bytes have arrived within DOWNLOAD_STALL_TIMEOUT_MS
 * (typical after a WiFi → mobile data switch leaves a half-open connection).
 * The stall watcher interval is always cleared, even on failure.
 * @param root0 - Attempt parameters.
 * @param root0.url - Source URL to download from.
 * @param root0.tempFile - Destination `.part` file.
 * @param root0.onProgressTick - Throttled progress callback; raw ticks update
 * the activity timestamp before forwarding.
 */
export const runDownloadAttempt = async ({
  onProgressTick,
  tempFile,
  url,
}: DownloadAttemptParams): Promise<void> => {
  const abortController = new AbortController()
  let lastActivityAt = Date.now()

  const handleRawProgress = onProgressTick
    ? (data: RawProgress) => {
        lastActivityAt = Date.now()
        onProgressTick(data)
      }
    : undefined

  const stallWatcher = setInterval(() => {
    const idleMs = Date.now() - lastActivityAt
    if (idleMs > DOWNLOAD_STALL_TIMEOUT_MS) abortController.abort()
  }, STALL_CHECK_INTERVAL_MS)

  try {
    await File.downloadFileAsync(url, tempFile, {
      idempotent: true,
      onProgress: handleRawProgress,
      signal: abortController.signal,
    })
  } finally {
    clearInterval(stallWatcher)
  }
}
