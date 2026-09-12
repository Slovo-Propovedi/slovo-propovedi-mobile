import { File } from 'expo-file-system'

export const DOWNLOAD_TIMEOUT_MS = 600_000

const createDownloadTimeoutError = (timeoutMs: number): Error =>
  new Error(`[updateService] Update download timed out after ${timeoutMs / 1000}s`)

const deleteFileBestEffort = (file: File): void => {
  try {
    if (file.exists) file.delete()
  } catch (error) {
    console.warn('[updateService] Failed to delete partial download:', error)
  }
}

const raceDownloadWithTimeout = <T>(
  downloadPromise: Promise<T>,
  signal: AbortSignal,
  timeoutMs: number,
): Promise<T> =>
  Promise.race([
    downloadPromise,
    new Promise<never>((_, reject) => {
      signal.addEventListener('abort', () => reject(createDownloadTimeoutError(timeoutMs)), {
        once: true,
      })
    }),
  ])

export const downloadFileWithTimeout = async (
  url: string,
  destination: File,
  onProgress: ((progressPercent: number) => void) | undefined,
  timeoutMs: number,
): Promise<File | null> => {
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs)

  try {
    const task = File.createDownloadTask(url, destination, {
      onProgress: onProgress
        ? ({ bytesWritten, totalBytes }) => {
            if (totalBytes <= 0) return
            onProgress(Math.round((bytesWritten / totalBytes) * 100))
          }
        : undefined,
      signal: abortController.signal,
    })

    return await raceDownloadWithTimeout(task.downloadAsync(), abortController.signal, timeoutMs)
  } catch (error) {
    deleteFileBestEffort(destination)
    if (abortController.signal.aborted) throw createDownloadTimeoutError(timeoutMs)
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
