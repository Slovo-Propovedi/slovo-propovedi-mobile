import { type APITypes } from 'shared/api'

export interface FlagFormValues {
  enabled: boolean
  key: string
  title: string
}

// Новый флаг создаётся выключенным (серверный CreateFeatureFlagRequest не
// принимает enabled) — глобальное состояние включается после создания.
const DEFAULT_ENABLED = false

// Ключ флага: lowercase kebab-case, начинается со строчной буквы (паттерн
// сервера `^[a-z][a-z0-9-]*$`).
const FLAG_KEY_PATTERN = /^[a-z][a-z0-9-]*$/

export const initialFlagFormValues = (initial?: APITypes.FeatureFlag | null): FlagFormValues => ({
  enabled: initial?.enabled ?? DEFAULT_ENABLED,
  key: initial?.key ?? '',
  title: initial?.title ?? '',
})

const isFilled = (value: string) => value.trim() !== ''

/**
 * Валидация формы создания: обязательны ключ и название, ключ — по паттерну.
 * @param values - Текущие значения формы.
 */
export const createValidationError = (values: FlagFormValues): string => {
  if (!isFilled(values.key) || !isFilled(values.title)) return 'Заполните ключ и название.'

  if (!FLAG_KEY_PATTERN.test(values.key.trim()))
    return 'Ключ: строчные латинские буквы, цифры и дефис, начинается с буквы.'

  return ''
}

/**
 * Тело обновления флага: **только изменённые** поля title/enabled. Ключ
 * неизменяем после создания, поэтому в тело не попадает.
 * @param values - Текущие значения формы.
 * @param initial - Исходная сущность для сравнения.
 */
export const buildUpdateFlagRequest = (
  values: FlagFormValues,
  initial: APITypes.FeatureFlag,
): APITypes.UpdateFeatureFlagRequest => {
  const payload: APITypes.UpdateFeatureFlagRequest = {}

  if (values.title.trim() !== initial.title.trim()) payload.title = values.title.trim()
  if (values.enabled !== initial.enabled) payload.enabled = values.enabled

  return payload
}
