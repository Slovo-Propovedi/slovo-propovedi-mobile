import { getErrorMessage } from 'shared/lib/error-utils'
import { type ImportErrorCode } from './importTypes'

// Понятные пользователю сообщения для каждого кода сбоя импорта. Ключ объекта —
// сам код, поэтому опечатка в коде не соберётся тихо: TypeScript потребует её
// отметить здесь.
const IMPORT_ERROR_MESSAGES: Record<ImportErrorCode, string> = {
  live: 'Прямые трансляции нельзя скачать',
  'login-required': 'Видео требует входа (возраст или подписка)',
  'no-audio': 'Аудиодорожка не найдена',
  parse: 'Некорректная ссылка YouTube',
  'service-unavailable': 'Сервис недоступен',
  'upload-failed': 'Не удалось загрузить файл на сервер',
  'video-unavailable': 'Видео недоступно',
}

// Для этих кодов техническая причина важна пользователю (и разработчику): без
// неё «не удалось загрузить» неотличимо от «сервис недоступен».
const CAUSE_DETAIL_CODES: readonly ImportErrorCode[] = ['service-unavailable', 'upload-failed']

/**
 * Сбой источника импорта с машинным кодом: UI показывает сообщение по коду,
 * неизвестные ошибки провалятся на `getErrorMessage`. Исходная ошибка
 * сохраняется в `rootCause`, чтобы toast назвал настоящую причину.
 * @param code - Причина сбоя.
 * @param rootCause - Исходная ошибка, обёрнутая в этот код (если есть).
 */
export class ImportSourceError extends Error {
  public constructor(code: ImportErrorCode, rootCause?: unknown) {
    super(IMPORT_ERROR_MESSAGES[code])
    this.name = 'ImportSourceError'
    this.code = code
    this.rootCause = rootCause
  }

  public code: ImportErrorCode
  public rootCause?: unknown
}

const appendRootCause = (message: string, rootCause: unknown): string => {
  if (rootCause == null) return message

  return `${message}: ${getErrorMessage(rootCause)}`
}

/**
 * Русское сообщение для toast: для наших ошибок — по коду (+ причина для
 * сбоев загрузки/сервиса), для любых других — текст исходной ошибки.
 * @param error - Пойманная ошибка импорта.
 */
export const getImportErrorMessage = (error: unknown): string => {
  if (!(error instanceof ImportSourceError)) return getErrorMessage(error)

  const message = IMPORT_ERROR_MESSAGES[error.code]
  if (!CAUSE_DETAIL_CODES.includes(error.code)) return message

  return appendRootCause(message, error.rootCause)
}
