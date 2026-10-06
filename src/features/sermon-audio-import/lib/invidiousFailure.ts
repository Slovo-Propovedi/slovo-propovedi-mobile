import { type ImportErrorCode } from './importTypes'
import { ImportSourceError } from './sourceErrors'

// Публичные инстансы Invidious всё чаще закрываются антиботом (Anubis и т. п.)
// или требуют авторизацию. UI показывает «Сервис недоступен» и дописывает
// причину из rootCause, поэтому причина обязана назвать инстанс: без хоста
// админ не поймёт, какой из адресов менять.
const SERVICE_UNAVAILABLE: ImportErrorCode = 'service-unavailable'

const AUTH_REQUIRED_MESSAGE = (host: string): string =>
  `Инстанс ${host} требует авторизацию — попробуйте другой инстанс или используйте свой`

const ANTIBOT_MESSAGE = (host: string): string =>
  `Инстанс ${host} закрыт антиботом — попробуйте другой инстанс или используйте свой`

// 401 и 403 — самые частые «стены» публичных инстансов.
const STATUS_MESSAGE_BUILDERS: Record<number, (host: string) => string> = {
  401: AUTH_REQUIRED_MESSAGE,
  403: ANTIBOT_MESSAGE,
}

const unavailable = (cause: string): ImportSourceError =>
  new ImportSourceError(SERVICE_UNAVAILABLE, new Error(cause))

/**
 * Хост инстанса для текста ошибки; невалидный URL отдаётся как есть.
 * @param base - Нормализованный адрес инстанса.
 */
export const readInstanceHost = (base: string): string => {
  try {
    return new URL(base).host
  } catch {
    return base
  }
}

// Антибот отдаёт HTML-страницу вызова (иногда со статусом 200/5xx), поэтому
// смотрим и content-type, и ведущий «<». Общий для скачивания и проверки
// доступности инстанса.
export const isHtmlBody = (response: Response, body: string): boolean => {
  const contentType = response.headers.get('content-type') ?? ''

  return contentType.includes('text/html') || body.trimStart().startsWith('<')
}

/**
 * Опознаёт сбой инстанса Invidious по ответу: 401 (нужна авторизация), 403 или
 * HTML-тело (антибот). Возвращает `null`, когда ответ пригоден для разбора.
 * @param response - Ответ инстанса.
 * @param body - Уже прочитанное тело ответа.
 * @param host - Хост инстанса для текста ошибки.
 */
export const toInstanceFailure = (
  response: Response,
  body: string,
  host: string,
): ImportSourceError | null => {
  const statusMessage = STATUS_MESSAGE_BUILDERS[response.status]
  if (statusMessage) return unavailable(statusMessage(host))
  if (isHtmlBody(response, body)) return unavailable(ANTIBOT_MESSAGE(host))

  return null
}

/**
 * Разбирает тело как JSON; невалидный JSON даёт `null` (не отдельное исключение).
 * @param body - Тело ответа.
 */
export const parseJsonBody = (body: string): unknown => {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}
