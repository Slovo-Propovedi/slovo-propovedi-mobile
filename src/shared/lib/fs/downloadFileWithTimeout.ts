import { File } from 'expo-file-system'

export const DOWNLOAD_TIMEOUT_MS = 600_000

/** Abort the download when no progress bytes arrive for this long (stall guard). */
export const DOWNLOAD_STALL_TIMEOUT_MS = 30_000

const createDownloadTimeoutError = (timeoutMs: number): Error =>
  new Error(`Download timed out after ${timeoutMs / 1000}s`)

const createStallTimeoutError = (stallTimeoutMs: number): Error =>
  new Error(`Download stalled: no progress for ${stallTimeoutMs / 1000}s`)

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
 * Скачивает файл с абсолютным бюджетом, stall-guard'ом и (необязательным)
 * внешним сигналом отмены, сообщая прогресс в процентах. При сбое частичный
 * файл удаляется — вызывающий всегда получает либо готовый файл, либо ошибку
 * без мусора на диске.
 * @param url - Источник.
 * @param destination - Куда скачивать (файл не перезаписывается).
 * @param onProgress - Колбэк прогресса 0–100 либо `undefined`.
 * @param timeoutMs - Таймаут скачивания.
 * @param externalSignal - Сигнал отмены от вызывающего (например, размонтирование).
 * @param stallTimeoutMs - Бюджет без прогресса, после которого закачка обрывается (stall guard).
 * @returns Скачанный файл либо `null`, если задача была приостановлена.
 */
export const downloadFileWithTimeout = async (
  url: string,
  destination: File,
  onProgress: ((progressPercent: number) => void) | undefined,
  timeoutMs: number,
  externalSignal?: AbortSignal,
  stallTimeoutMs: number = DOWNLOAD_STALL_TIMEOUT_MS,
): Promise<File | null> => {
  // Сигнал мог отмениться ещё до вызова (размонтирование формы между рендерами):
  // addEventListener на сработавшем сигнале уже не сработает, поэтому отменяем сразу
  // и не создаём файл вовсе — так же поступает expo в wireNetworkTaskAbortSignal.
  if (externalSignal?.aborted) throw createDownloadTimeoutError(timeoutMs)

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs)
  const abortFromExternalSignal = () => abortController.abort()
  externalSignal?.addEventListener('abort', abortFromExternalSignal, { once: true })

  let stalled = false
  let isFinished = false
  let stallTimerId: null | ReturnType<typeof setTimeout> = null
  const rearmStallTimer = () => {
    // Хвостовой тик прогресса может прийти после завершения загрузки: без этого
    // гварда он заново заряжал бы stall-таймер, который уже некому снять.
    if (isFinished) return
    if (stallTimerId !== null) clearTimeout(stallTimerId)
    stallTimerId = setTimeout(() => {
      stalled = true
      abortController.abort()
    }, stallTimeoutMs)
  }

  try {
    const task = File.createDownloadTask(url, destination, {
      // Внутренний обработчик висит всегда (независимо от onProgress): он
      // перезаряжает stall-таймер на каждом сыром тике, включая totalBytes <= 0,
      // а процент наружу отдаёт только при наличии колбэка и известного размера.
      onProgress: ({ bytesWritten, totalBytes }) => {
        rearmStallTimer()
        if (!onProgress || totalBytes <= 0) return
        onProgress(Math.round((bytesWritten / totalBytes) * 100))
      },
      signal: abortController.signal,
    })
    rearmStallTimer()

    return await raceDownloadWithTimeout(task.downloadAsync(), abortController.signal, timeoutMs)
  } catch (error) {
    deleteFileBestEffort(destination)
    if (stalled) throw createStallTimeoutError(stallTimeoutMs)
    if (abortController.signal.aborted) throw createDownloadTimeoutError(timeoutMs)
    throw error
  } finally {
    isFinished = true
    clearTimeout(timeoutId)
    if (stallTimerId !== null) {
      clearTimeout(stallTimerId)
      stallTimerId = null
    }
    externalSignal?.removeEventListener('abort', abortFromExternalSignal)
  }
}
