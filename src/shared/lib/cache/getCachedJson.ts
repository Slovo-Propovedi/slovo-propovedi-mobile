import AsyncStorage from '@react-native-async-storage/async-storage'
import type z from 'zod'
import { getParseJsonWithSchema } from '../../model/getParseJsonWithSchema'

export const getCachedJson = async <T>(
  key: string,
  schema: z.ZodType<T>,
): Promise<T | undefined> => {
  const json = await AsyncStorage.getItem(key)

  return getParseJsonWithSchema(schema)(json)
}
