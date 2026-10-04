import { type ImportErrorCode, type ResolvedAudio } from './importTypes'
import { ImportSourceError } from './sourceErrors'

const REQUEST_TIMEOUT_MS = 15_000

// Некоторые инстансы режут запросы без похожего на браузер User-Agent.
const INVIDIOUS_USER_AGENT = 'Mozilla/5.0 (Linux; Android 13; rv:120.0) Gecko/120.0 Firefox/120.0'

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

const normalizeBaseUrl = (invidiousBaseUrl: string): string =>
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
  durationSec: Number(payload.lengthSeconds) || null,
  title: typeof payload.title === 'string' ? payload.title : '',
  videoId,
})

/**
 * Достаёт метаданные и ссылку на аудиодорожку из публичного API инстанса
 * Invidious. Сеть недоступна, инстанс не ответил или ответил ошибкой —
 * «Сервис недоступен»; сам инстанс сообщил об ошибке (видео удалено, приватное) —
 * «Видео недоступно».
 * @param invidiousBaseUrl - Адрес инстанса (с хвостовыми слэшами допустим).
 * @param videoId - ID видео YouTube.
 */
export const resolveInvidiousAudio = async (
  invidiousBaseUrl: string,
  videoId: string,
): Promise<ResolvedAudio> => {
  const base = normalizeBaseUrl(invidiousBaseUrl)
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${base}/api/v1/videos/${videoId}?local=true`, {
      headers: { Accept: 'application/json', 'User-Agent': INVIDIOUS_USER_AGENT },
      signal: abortController.signal,
    })
    if (!response.ok) throw new ImportSourceError(SERVICE_UNAVAILABLE)

    const payload: unknown = await response.json()
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
