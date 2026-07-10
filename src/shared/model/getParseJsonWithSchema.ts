import type z from 'zod'
import { customZ } from '../api/schemas/customZ'

export const getParseJsonWithSchema =
  <T>(schema: z.ZodSchema<T>) =>
  (jsonString: null | string): T | undefined => {
    if (!jsonString) return undefined

    try {
      const result = customZ.jsonSchema(schema).safeParse(jsonString)
      return result.success ? result.data : undefined
    } catch (error) {
      console.error('[getParseJsonWithSchema] Parse error:', error)
      return undefined
    }
  }
