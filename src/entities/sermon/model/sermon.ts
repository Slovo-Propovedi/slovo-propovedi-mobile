import z from 'zod'
import { playlistDataSchema } from 'entities/playlist/@x/sermon'

/**
 * Схема проповеди (SermonData). Книга — тоже проповедь: bookSchema = sermonSchema.
 * Структурно совпадает с API-типом SermonEntity, поэтому данные с сервера
 * можно использовать без преобразования.
 */
export const sermonSchema = z.object({
  artist: z.string(),
  // API может вернуть null (несмотря на OpenAPI-спеку) — оставляем null как есть
  artwork: z.string().nullable(),
  audioUrl: z.string().nullable().optional(),
  book: z.string().nullish(),
  chapter: z.union([z.number(), z.array(z.number())]).nullish(),
  description: z.string().optional(),
  id: z.string(),
  playlists: z.lazy(() => z.array(playlistDataSchema)).optional(),
  textFileUrl: z.string().nullable().optional(),
  title: z.string(),
  verse: z
    .union([z.number(), z.array(z.number()), z.array(z.union([z.number(), z.array(z.number())]))])
    .nullish(),
  youtubeUrl: z.string().nullable().optional(),
})

/** Тип проповеди (извлекается из схемы). */
export type SermonData = z.infer<typeof sermonSchema>

/** Схема для книги (BookData). Книга - это тоже проповедь. */
export const bookSchema = sermonSchema

/** Тип книги (извлекается из схемы). */
export type BookData = SermonData

/** Схема для массива книг (BookData[]). */
export const booksArraySchema = z.array(bookSchema)

// Алиасы для обратной совместимости
export const sermonDataSchema = sermonSchema
export const bookDataSchema = bookSchema
