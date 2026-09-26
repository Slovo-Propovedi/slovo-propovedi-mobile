import z from 'zod'
import { sectionSchema } from 'entities/section/@x/playlist'
import { type SectionShape, type SermonShape } from 'shared/model'

/**
 * Схема плейлиста (PlaylistData).
 *
 * Проповеди на границе плейлиста остаются структурной формой `SermonShape`:
 * канонический валидатор проповеди живёт в entities/sermon. Секции
 * валидируются схемой entities/section (зависимость playlist → section).
 * Аннотация `SectionShape[]` не даёт типам секции и плейлиста замкнуться друг
 * на друга (см. Docs/architecture.md).
 */
export const playlistSchema = z.object({
  artwork: z.string().nullable(),
  description: z.string().optional(),
  id: z.string(),
  sections: z.lazy((): z.ZodType<SectionShape[]> => z.array(sectionSchema)).optional(),
  sermons: z.array(z.custom<SermonShape>()),
  title: z.string(),
})

/** Тип плейлиста (извлекается из схемы). */
export type PlaylistData = z.infer<typeof playlistSchema>

/** Схема для массива плейлистов (PlaylistData[]). */
export const playlistsArraySchema = z.array(playlistSchema)

// Алиас для обратной совместимости
export const playlistDataSchema = playlistSchema
