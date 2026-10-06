import { File } from 'expo-file-system'

export const DOWNLOAD_TIMEOUT_MS = 600_000

const createDownloadTimeoutError = (timeoutMs: number): Error =>
  new Error(`Download timed out after ${timeoutMs / 1000}s`)

const deleteFileBestEffort = (file: File): void => {
  try {
    if (file.exists) file.delete()
  } catch (error) {
    console.warn('[downloadFileWithTimeout] Failed to delete partial download:', error)
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

/**
 * Скачивает файл с таймаутом и (необязательным) внешним сигналом отмены,
 * сообщая прогресс в процентах. При сбое частичный файл удаляется — вызывающий
 * всегда получает либо готовый файл, либо ошибку без мусора на диске.
 * @param url - Источник.
 * @param destination - Куда скачивать (файл не перезаписывается).
 * @param onProgress - Колбэк прогресса 0–100 либо `undefined`.
 * @param timeoutMs - Таймаут скачивания.
 * @param externalSignal - Сигнал отмены от вызывающего (например, размонтирование).
 * @returns Скачанный файл либо `null`, если задача была приостановлена.
 */
export const downloadFileWithTimeout = async (
  url: string,
  destination: File,
  onProgress: ((progressPercent: number) => void) | undefined,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<File | null> => {
  // Сигнал мог отмениться ещё до вызова (размонтирование формы между рендерами):
  // addEventListener на сработавшем сигнале уже не сработает, поэтому отменяем сразу
  // и не создаём файл вовсе — так же поступает expo в wireNetworkTaskAbortSignal.
  if (externalSignal?.aborted) throw createDownloadTimeoutError(timeoutMs)

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs)
  const abortFromExternalSignal = () => abortController.abort()
  externalSignal?.addEventListener('abort', abortFromExternalSignal, { once: true })

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
    externalSignal?.removeEventListener('abort', abortFromExternalSignal)
  }
}
