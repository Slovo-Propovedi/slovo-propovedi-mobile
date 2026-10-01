import type z from 'zod'
import { customZ } from '../api/schemas/customZ'

export const getParseJsonWithSchema =
  <T>(schema: z.ZodSchema<T>, onInvalid?: (issues: z.ZodIssue[]) => void) =>
  (jsonString: null | string): T | undefined => {
    if (!jsonString) return undefined

    try {
      const result = customZ.jsonSchema(schema).safeParse(jsonString)
      if (result.success) return result.data
      onInvalid?.(result.error.issues)
      return undefined
    } catch (error) {
      console.error('[getParseJsonWithSchema] Parse error:', error)
      return undefined
    }
  }
