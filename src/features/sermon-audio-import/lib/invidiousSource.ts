import { type ImportErrorCode, type ResolvedAudio } from './importTypes'
import { parseInvidiousBasicAuth } from './invidiousBasicAuth'
import { parseJsonBody, readInstanceHost, toInstanceFailure } from './invidiousFailure'
import { ImportSourceError } from './sourceErrors'

const REQUEST_TIMEOUT_MS = 15_000

// Некоторые инстансы режут запросы без похожего на браузер User-Agent. Тот же
// заголовок использует проверка доступности инстанса при добавлении (см.
// validateInvidiousInstance), чтобы проба шла по тому же пути, что и скачивание.
export const INVIDIOUS_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13; rv:120.0) Gecko/120.0 Firefox/120.0'

// itag 140 — аудио в AAC/mp4: играется нативно и в вебе, в отличие от opus/webm.
const PREFERRED_ITAG = '140'
const PREFERRED_MIME_TYPE = 'audio/mp4'

// Инстанс отвечает 5xx/429 или отдаёт не-JSON — для пользователя это один и тот
// же «сервис недоступен», поэтому код вынесен в константу.
const SERVICE_UNAVAILABLE: ImportErrorCode = 'service-unavailable'

interface InvidiousFormat {
  bitrate: number
  itag: string
  mimeType: string
  url: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const normalizeBaseUrl = (invidiousBaseUrl: string): string =>
  invidiousBaseUrl.trim().replace(/\/+$/, '')

const readFormats = (payload: Record<string, unknown>): InvidiousFormat[] => {
  if (!Array.isArray(payload.adaptiveFormats)) return []

  return payload.adaptiveFormats.filter(isRecord).map(format => ({
    // Числа в ответе Invidious приходят строками — приводим к Number.
    bitrate: Number(format.bitrate) || 0,
    itag: String(format.itag ?? ''),
    mimeType: typeof format.type === 'string' ? format.type : '',
    url: typeof format.url === 'string' ? format.url : '',
  }))
}

const pickFormat = (formats: InvidiousFormat[]): InvidiousFormat => {
  const audioFormats = formats.filter(format => format.mimeType.startsWith('audio/'))
  if (audioFormats.length === 0) throw new ImportSourceError('no-audio')

  // В ответе бывают дубли itag 140 — берём первый подходящий.
  const preferred = audioFormats.find(
    format => format.itag === PREFERRED_ITAG && format.mimeType.includes(PREFERRED_MIME_TYPE),
  )
  if (preferred) return preferred

  return [...audioFormats].sort((first, second) => second.bitrate - first.bitrate)[0]
}

const toResolvedAudio = (
  payload: Record<string, unknown>,
  videoId: string,
  format: InvidiousFormat,
): ResolvedAudio => ({
  audioUrl: format.url,
  description: typeof payload.description === 'string' ? payload.description : null,
  title: typeof payload.title === 'string' ? payload.title : '',
  videoId,
})

/**
 * Достаёт метаданные и ссылку на аудиодорожку из публичного API инстанса
 * Invidious. Недоступность/сетевой сбой — «Сервис недоступен»; 401 —
 * «требует авторизацию», 403 или HTML-ответ (антибот) — «закрыт антиботом»;
 * сам инстанс сообщил об ошибке (видео удалено, приватное) — «Видео недоступно».
 * Учётные данные из адреса (`user:pass@host`, basic auth) уходят заголовком
 * `Authorization`, а не в URL; в текстах ошибок остаётся только хост.
 * @param invidiousBaseUrl - Адрес инстанса (с хвостовыми слэшами допустим).
 * @param videoId - ID видео YouTube.
 */
export const resolveInvidiousAudio = async (
  invidiousBaseUrl: string,
  videoId: string,
): Promise<ResolvedAudio> => {
  const base = normalizeBaseUrl(invidiousBaseUrl)
  const host = readInstanceHost(base)
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS)

  try {
    const { authHeader, requestBase } = parseInvidiousBasicAuth(base)
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': INVIDIOUS_USER_AGENT,
    }
    if (authHeader) headers.Authorization = authHeader

    const response = await fetch(`${requestBase}/api/v1/videos/${videoId}?local=true`, {
      headers,
      signal: abortController.signal,
    })
    const body = await response.text()
    const failure = toInstanceFailure(response, body, host)
    if (failure) throw failure
    if (!response.ok) throw new ImportSourceError(SERVICE_UNAVAILABLE)

    const payload = parseJsonBody(body)
    if (!isRecord(payload)) throw new ImportSourceError(SERVICE_UNAVAILABLE)
    if (typeof payload.error === 'string') throw new ImportSourceError('video-unavailable')

    return toResolvedAudio(payload, videoId, pickFormat(readFormats(payload)))
  } catch (error) {
    if (error instanceof ImportSourceError) throw error

    throw new ImportSourceError(SERVICE_UNAVAILABLE)
  } finally {
    clearTimeout(timeout)
  }
}
