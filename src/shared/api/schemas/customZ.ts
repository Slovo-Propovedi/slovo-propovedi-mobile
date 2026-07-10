import { z } from 'zod'
import { type MimeType } from '../../model/file/mimeTypes'

export const customZ = {
  jsonSchema: <T extends z.ZodTypeAny>(schema: T) =>
    z
      .string()
      .transform((val, ctx) => {
        try {
          return JSON.parse(val)
        } catch {
          ctx.addIssue({
            code: 'custom',
            message: '[jsonSchema]: Invalid json parse attempt',
          })
          return z.NEVER
        }
      })
      .pipe(schema),
  // мы можем о многих типах не знать, поэтому просто проверяем что строка и кастуем к нашему типу
  mimeType: () => z.custom<MimeType>(data => typeof data === 'string', '[mimeType]: Invalid type'),
  timestamp: () => z.number().int(),
}
