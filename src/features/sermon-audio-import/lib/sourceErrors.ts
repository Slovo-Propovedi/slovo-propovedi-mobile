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

/**
 * Сбой источника импорта с машинным кодом: UI показывает сообщение по коду,
 * неизвестные ошибки провалятся на `getErrorMessage`.
 * @param code - Причина сбоя.
 */
export class ImportSourceError extends Error {
  public constructor(code: ImportErrorCode) {
    super(IMPORT_ERROR_MESSAGES[code])
    this.name = 'ImportSourceError'
    this.code = code
  }

  public code: ImportErrorCode
}

/**
 * Русское сообщение для toast: для наших ошибок — по коду, для любых других —
 * текст исходной ошибки.
 * @param error - Пойманная ошибка импорта.
 */
export const getImportErrorMessage = (error: unknown): string =>
  error instanceof ImportSourceError ? IMPORT_ERROR_MESSAGES[error.code] : getErrorMessage(error)
