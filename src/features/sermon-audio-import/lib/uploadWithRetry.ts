import { type AxiosError, isAxiosError } from 'axios'
import { getErrorMessage } from 'shared/lib/error-utils'
import { ImportSourceError } from './sourceErrors'

// Один повторный заход после обрыва VPN/сети: 3 попытки всего, паузы 1.5с и 3с.
const MAX_ATTEMPTS = 3
const RETRY_BACKOFF_MS = [1500, 3000]
const BYTES_PER_MEGABYTE = 1024 * 1024
const CONNECTION_HINT =
  ' (обрыв соединения: проверьте лимит размера на сервере и стабильность сети)'

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

// Загрузка идёт через shared/api, который оборачивает axios-ошибку в Error с
// cause: исходный ответ/сеть доступны только по цепочке cause.
const findAxiosError = (error: unknown): AxiosError | undefined => {
  let current: unknown = error

  while (current instanceof Error) {
    if (isAxiosError(current)) return current
    current = current.cause
  }

  return undefined
}

// Обрыв транспорта (нет ответа) стоит повторить; HTTP-ответ сервера (4xx/5xx) —
// нет, он не изменится от повтора.
const isNetworkLevelError = (error: unknown): boolean => {
  const axiosError = findAxiosError(error)

  return axiosError !== undefined && axiosError.response === undefined
}

const formatFileSize = (bytes: number): string => `${(bytes / BYTES_PER_MEGABYTE).toFixed(1)} МБ`

const buildDiagnostics = (attempts: number, durationMs: number, sizeBytes: number): string =>
  `Файл: ${formatFileSize(sizeBytes)}; попыток: ${attempts}; ${Math.round(durationMs / 1000)} с`

const createFailure = (
  error: unknown,
  attempts: number,
  durationMs: number,
  sizeBytes: number,
): Error => {
  const hint = isNetworkLevelError(error) ? CONNECTION_HINT : ''
  const diagnostics = buildDiagnostics(attempts, durationMs, sizeBytes)

  return new Error(`${getErrorMessage(error)}; ${diagnostics}${hint}`, { cause: error })
}

/**
 * Загружает файл с повтором только сетевых обрывов: до 3 попыток с паузами
 * 1.5с/3с. HTTP-ошибка с ответом не повторяется. Финальный сбой несёт в тексте
 * размер файла, число попыток и длительность — для диагностики в диалоге.
 * @param upload - Одна попытка загрузки, возвращает URL файла.
 * @param sizeBytes - Размер загружаемого файла в байтах.
 */
export const uploadWithRetry = async (
  upload: () => Promise<string>,
  sizeBytes: number,
): Promise<string> => {
  const startedAt = Date.now()

  for (let attempt = 1; ; attempt += 1)
    try {
      return await upload()
    } catch (error) {
      // Доменные ошибки (нет файла на диске и т. п.) — не транспорт, не повторяем.
      if (error instanceof ImportSourceError) throw error

      const isLastAttempt = attempt >= MAX_ATTEMPTS
      if (!isNetworkLevelError(error) || isLastAttempt)
        throw createFailure(error, attempt, Date.now() - startedAt, sizeBytes)

      await sleep(RETRY_BACKOFF_MS[attempt - 1])
    }
}
