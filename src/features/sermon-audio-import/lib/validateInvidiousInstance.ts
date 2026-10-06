import { parseInvidiousBasicAuth } from './invidiousBasicAuth'
import { isHtmlBody, parseJsonBody } from './invidiousFailure'
import { INVIDIOUS_USER_AGENT, normalizeBaseUrl } from './invidiousSource'

// Rick Astley — Never Gonna Give You Up: очень стабильное публичное видео, взятое
// только как мишень проверки, что API инстанса отдаёт аудио. Оно не связано с
// контентом приложения и не станет приватным или удалённым.
const TEST_VIDEO_ID = 'dQw4w9WgXcQ'

const ANTIBOT_MESSAGE = 'Инстанс закрыт антиботом — API недоступен'
const AUTH_REQUIRED_MESSAGE = 'Инстанс требует авторизацию — API недоступен'
const NO_AUDIO_MESSAGE = 'API инстанса не отдаёт аудио для тестового видео'

// Известный сбой проверки инстанса с готовым текстом для админа. Всё, что не
// этот класс, вызывающий уводит в копируемый диалог `reportError`.
export class InvidiousInstanceError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'InvidiousInstanceError'
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const hasMp4Audio = (payload: Record<string, unknown>): boolean => {
  if (!Array.isArray(payload.adaptiveFormats)) return false

  return payload.adaptiveFormats.some(
    format =>
      isRecord(format) &&
      typeof format.type === 'string' &&
      format.type.startsWith('audio/mp4') &&
      typeof format.url === 'string' &&
      format.url.length > 0,
  )
}

/**
 * Проверяет, что инстанс Invidious отвечает по API и отдаёт аудио для тестового
 * видео. Запрос идёт с клиента: именно с устройства (на web — ещё и с проверкой
 * CORS) реально скачивается аудио, поэтому серверная проба показала бы не тот
 * сетевой путь. Известные сбои (антибот, авторизация, нет аудио) приходят как
 * `InvidiousInstanceError` с готовым текстом; сеть, не-JSON без HTML-маркеров и
 * таймауты пробрасываются как есть — вызывающий открывает копируемый диалог.
 * @param url - Адрес инстанса (хвостовые слэши допустимы).
 * @param signal - Отмена запроса (необязательно).
 */
export const validateInvidiousInstance = async (
  url: string,
  signal?: AbortSignal,
): Promise<void> => {
  const { authHeader, requestBase } = parseInvidiousBasicAuth(normalizeBaseUrl(url))
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': INVIDIOUS_USER_AGENT,
  }
  if (authHeader) headers.Authorization = authHeader

  const response = await fetch(`${requestBase}/api/v1/videos/${TEST_VIDEO_ID}?local=true`, {
    headers,
    signal,
  })
  const body = await response.text()

  if (isHtmlBody(response, body)) throw new InvidiousInstanceError(ANTIBOT_MESSAGE)
  if (response.status === 401 || response.status === 403)
    throw new InvidiousInstanceError(AUTH_REQUIRED_MESSAGE)

  if (response.status !== 200)
    throw new Error(`Invidious instance probe failed with status ${response.status}`)

  const payload = parseJsonBody(body)
  if (!isRecord(payload)) throw new Error('Invidious instance probe returned a non-JSON body')
  if ('error' in payload || !hasMp4Audio(payload))
    throw new InvidiousInstanceError(NO_AUDIO_MESSAGE)
}
