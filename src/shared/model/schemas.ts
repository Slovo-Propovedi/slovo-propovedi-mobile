import type z from 'zod'
import { parseJSONToObject } from '../lib/utils/parseJSONToObject'

export const parseJsonWithSchema =
  <T>(schema: z.ZodSchema<T>) =>
  (jsonString: null | string): T | undefined => {
    if (!jsonString) return undefined

    try {
      const result = schema.safeParse(parseJSONToObject(jsonString))
      return result.success ? result.data : undefined
    } catch {
      return undefined
    }
  }
