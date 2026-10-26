import z from 'zod'
import {
  ARTWORK_URL_PATTERN,
  FILE_URL_PATTERN,
  INPUT_LIMITS,
  YOUTUBE_URL_PATTERN,
} from './inputLimits'

const URL_MESSAGE = 'укажите корректную ссылку.'
const FILE_URL_MESSAGE = 'ссылка должна указывать на файл в хранилище (…/files/…).'

const absoluteUrl = z.url()

/**
 * Сообщение о превышении максимальной длины; '' — значение в пределах лимита.
 * Длина считается по очищенному значению: именно его форма отправляет на сервер.
 * @param value - Текущее значение поля.
 * @param max - Максимальная длина из сгенерированных констант.
 * @param label - Русская подпись поля для сообщения.
 */
export const maxLengthError = (value: string, max: number, label: string): string =>
  value.trim().length > max ? `${label}: не более ${max} символов.` : ''

/**
 * Сообщение о превышении максимального размера массива связей; '' — в пределах.
 * @param count - Количество выбранных элементов.
 * @param max - Максимальный размер массива из сгенерированных констант.
 * @param label - Русская подпись массива для сообщения.
 */
export const maxItemsError = (count: number, max: number, label: string): string =>
  count > max ? `${label}: не более ${max} значений.` : ''

/**
 * Проверка пароля по границам спецификации (8–200 символов).
 * Пустая строка тоже нарушает минимум — вызывающий может проверить её отдельно.
 * @param value - Введённый пароль.
 */
export const passwordError = (value: string): string => {
  const length = value.trim().length
  if (length < INPUT_LIMITS.user.passwordMin)
    return `Пароль должен содержать минимум ${INPUT_LIMITS.user.passwordMin} символов.`
  if (length > INPUT_LIMITS.user.passwordMax)
    return `Пароль должен содержать не более ${INPUT_LIMITS.user.passwordMax} символов.`

  return ''
}

/**
 * Проверка http(s)-ссылки для `youtubeUrl`; '' — пустое поле допустимо (null).
 * `z.url()` сам по себе пропускает `javascript:`/`data:`, поэтому дополнительно
 * применяется паттерн спецификации `^https?://.+$`.
 * @param value - Значение поля.
 * @param label - Русская подпись поля для сообщения.
 */
export const urlError = (value: string, label: string): string => {
  const trimmed = value.trim()
  if (trimmed === '') return ''

  return absoluteUrl.safeParse(trimmed).success && YOUTUBE_URL_PATTERN.test(trimmed)
    ? ''
    : `${label}: ${URL_MESSAGE}`
}

/**
 * Проверка ссылки на обложку (`^(https?://.*)?$`): пустая строка или http(s).
 * @param value - Значение поля.
 * @param label - Русская подпись поля для сообщения.
 */
export const artworkUrlError = (value: string, label: string): string =>
  ARTWORK_URL_PATTERN.test(value.trim()) ? '' : `${label}: ${URL_MESSAGE}`

/**
 * Проверка ссылки на файл в хранилище (`^https?://[^/]+/files/.+$`).
 * '' — пустое поле допустимо (на сервер уходит null).
 * @param value - Значение поля.
 * @param label - Русская подпись поля для сообщения.
 */
export const fileUrlError = (value: string, label: string): string =>
  value.trim() === '' || FILE_URL_PATTERN.test(value.trim()) ? '' : `${label}: ${FILE_URL_MESSAGE}`
