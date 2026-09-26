import z from 'zod'
import { sectionSchema } from 'entities/section/@x/playlist'
import { type SectionShape, type SermonShape } from 'shared/model'

/**
 * Минимальная структурная проверка вложенной проповеди (SermonShape).
 *
 * Проверяет только обязательные поля (id/title/artist/artwork), достаточные,
 * чтобы отсеять мусор в `sermons` плейлиста. Полная zod-валидация живёт в
 * entities/sermon и применяется на верхнеуровневых границах; здесь её не
 * вызываем, чтобы не замкнуть playlist ↔ sermon (см. Docs/architecture.md).
 * @param value - Кандидат на SermonShape (untrusted, unknown).
 * @returns `true`, если структура минимально валидна.
 */
const isSermonShape = (value: unknown): value is SermonShape =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'string' &&
  'title' in value &&
  typeof value.title === 'string' &&
  'artist' in value &&
  typeof value.artist === 'string' &&
  'artwork' in value &&
  (value.artwork === null || typeof value.artwork === 'string')

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
  sermons: z.array(z.custom<SermonShape>(isSermonShape)),
  title: z.string(),
})

/** Тип плейлиста (извлекается из схемы). */
export type PlaylistData = z.infer<typeof playlistSchema>

/** Схема для массива плейлистов (PlaylistData[]). */
export const playlistsArraySchema = z.array(playlistSchema)

// Алиас для обратной совместимости
export const playlistDataSchema = playlistSchema
