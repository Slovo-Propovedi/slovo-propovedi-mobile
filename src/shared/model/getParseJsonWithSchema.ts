import type z from 'zod'
import { customZ } from '../api/schemas/customZ'

/**
 * Результат безопасного парсинга JSON-строки схемой.
 *
 * Различает «ключа нет» (`empty`) и «данные есть, но невалидны» (`invalid` /
 * `error`): вызывающему важно не перезаписывать испорченное хранилище сидом.
 */
export type ParseJsonResult<T> =
  | { issues: z.ZodIssue[]; status: 'invalid' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'parsed'; value: T }

/**
 * Парсит JSON-строку схемой, возвращая типизированный результат вместо
 * `undefined` (который смешивал бы отсутствие данных с провалом парсинга).
 * @param schema - Zod-схема ожидаемого значения.
 * @param jsonString - Сырая JSON-строка или `null`, если ключа нет.
 */
export const parseJsonWithSchema = <T>(
  schema: z.ZodSchema<T>,
  jsonString: null | string,
): ParseJsonResult<T> => {
  if (!jsonString) return { status: 'empty' }

  try {
    const result = customZ.jsonSchema(schema).safeParse(jsonString)
    if (result.success) return { status: 'parsed', value: result.data }
    return { issues: result.error.issues, status: 'invalid' }
  } catch (error) {
    console.error('[parseJsonWithSchema] Parse error:', error)
    return { status: 'error' }
  }
}

export const getParseJsonWithSchema =
  <T>(schema: z.ZodSchema<T>, onInvalid?: (issues: z.ZodIssue[]) => void) =>
  (jsonString: null | string): T | undefined => {
    const result = parseJsonWithSchema(schema, jsonString)
    if (result.status === 'parsed') return result.value
    if (result.status === 'invalid') onInvalid?.(result.issues)
    return undefined
  }
