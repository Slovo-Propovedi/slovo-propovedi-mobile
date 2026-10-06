export const INSTANCE_URL_PREFIX = 'https://'

export type AddInstanceResult = 'duplicate' | 'invalid' | 'ok'

/**
 * Проверяет адрес перед добавлением в список: он обязан быть полным https-URL
 * (бэкенд отвергает остальные) и не дублировать уже добавленные.
 * @param url - Введённый администратором адрес.
 * @param existing - Текущий список адресов.
 */
export const validateInstanceUrl = (
  url: string,
  existing: readonly string[],
): AddInstanceResult => {
  const trimmed = url.trim()

  if (!trimmed.startsWith(INSTANCE_URL_PREFIX)) return 'invalid'
  if (existing.includes(trimmed)) return 'duplicate'

  return 'ok'
}
