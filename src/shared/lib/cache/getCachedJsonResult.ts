import AsyncStorage from '@react-native-async-storage/async-storage'
import type z from 'zod'
import { type ParseJsonResult, parseJsonWithSchema } from '../../model/getParseJsonWithSchema'

/**
 * Читает JSON под ключом и парсит его схемой, различая отсутствие ключа и
 * провал парсинга (в отличие от `getCachedJson`, который в обоих случаях
 * возвращает `undefined`).
 * @param key - Ключ AsyncStorage.
 * @param schema - Zod-схема ожидаемого значения.
 */
export const getCachedJsonResult = async <T>(
  key: string,
  schema: z.ZodType<T>,
): Promise<ParseJsonResult<T>> => {
  const json = await AsyncStorage.getItem(key)

  return parseJsonWithSchema(schema, json)
}
