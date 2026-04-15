import z from 'zod'

/**
 * Доменные типы приложения.
 *
 * Все типы извлекаются из Zod схем в этом файле.
 * Это обеспечивает единственный источник правды для типов.
 *
 * Серверные типы (APITypes) используются только в мапперах
 * для конвертации данных из API формата во внутренний.
 */

/**
 * Схема для проповеди (SermonData).
 */
export const sermonSchema = z.object({
  artist: z.string(),
  artwork: z.string(),
  audioUrl: z.string().nullable().optional(),
  chapter: z.number().optional(),
  description: z.string().optional(),
  id: z.string(),
  playlists: z.array(z.any()).optional(),
  textFileUrl: z.string().nullable().optional(),
  title: z.string(),
  verse: z.union([z.tuple([z.number(), z.number()]), z.number()]).optional(),
  youtubeUrl: z.string().nullable().optional(),
})

/**
 * Тип проповеди (извлекается из схемы).
 */
export type SermonData = z.infer<typeof sermonSchema>

/**
 * Схема для плейлиста (PlaylistData).
 */
export const playlistSchema = z.object({
  artwork: z.string(),
  description: z.string().optional(),
  id: z.string(),
  sections: z.array(z.any()).optional(),
  sermons: z.array(sermonSchema),
  title: z.string(),
})

/**
 * Тип плейлиста (извлекается из схемы).
 */
export type PlaylistData = z.infer<typeof playlistSchema>

/**
 * Схема для книги (BookData).
 * Книга - это тоже проповедь.
 */
export const bookSchema = sermonSchema

/**
 * Тип книги (извлекается из схемы).
 */
export type BookData = SermonData

// Алиасы для обратной совместимости
export const sermonDataSchema = sermonSchema
export const playlistDataSchema = playlistSchema
export const bookDataSchema = bookSchema
