import z from 'zod'

/**
 * Доменные типы секций и плейлистов приложения.
 * Проповеди/книги/треки переехали в entities/sermon (Phase 1 рефакторинга).
 *
 * До переноса `playlistSchema`/`sectionSchema` в entities здесь остаётся
 * структурный `SermonShape` — минимальная loose-типизация границы для
 * playlist/section (валидацию содержимого проповедей выполняет entities/sermon).
 */

/**
 * Структурная форма проповеди на границе shared-слоя.
 * Канонический доменный тип — `SermonData` из entities/sermon; structural —
 * чтобы shared (playlist/section, mappers, mock db) не импортировал entities.
 */
export interface SermonShape {
  artist: string
  artwork: null | string
  audioUrl?: null | string | undefined
  book?: null | string | undefined
  chapter?: null | number | number[] | undefined
  description?: string | undefined
  id: string
  playlists?: PlaylistDataDef[] | undefined
  textFileUrl?: null | string | undefined
  title: string
  verse?: (number | number[])[] | null | number | number[] | undefined
  youtubeUrl?: null | string | undefined
}

/** Интерфейс для плейлиста (PlaylistData). Используется для опережающего объявления типов. */
interface PlaylistDataDef {
  artwork: null | string
  description?: string | undefined
  id: string
  sections?: SectionDataDef[] | undefined
  sermons: SermonShape[]
  title: string
}

/** Интерфейс для секции (SectionData). Используется для опережающего объявления типов. */
interface SectionDataDef {
  borderRadius?: boolean | undefined
  description?: null | string | undefined
  id?: string | undefined
  isDescriptionTitleOnSlideLarge?: boolean | undefined
  itemsRows?: null | number | undefined
  itemsSize: 'large' | 'middle' | 'small' | 'xLarge'
  playlists?: PlaylistDataDef[] | undefined
  title?: string | undefined
  transform: 'high' | 'middle' | 'short'
  whereIsSlideTitleLocated?: 'bothOnAndUnder' | 'on' | 'under' | undefined
}

/** Схема для секции (SectionData). */
export const sectionSchema = z.object({
  borderRadius: z.boolean().optional(),
  description: z.string().nullable().optional(),
  id: z.string().optional(),
  isDescriptionTitleOnSlideLarge: z.boolean().optional(),
  itemsRows: z.number().nullable().optional(),
  itemsSize: z.enum(['large', 'middle', 'small', 'xLarge']),
  playlists: z.lazy((): z.ZodType<PlaylistDataDef[]> => z.array(playlistSchema)).optional(),
  title: z.string().optional(),
  transform: z.enum(['high', 'short', 'middle']),
  whereIsSlideTitleLocated: z.enum(['bothOnAndUnder', 'on', 'under']).optional(),
})

/** Тип секции (извлекается из схемы). */
export type SectionData = z.infer<typeof sectionSchema>

/**
 * Схема для плейлиста (PlaylistData).
 * Содержимое проповедей не валидируется здесь (loose-граница до переноса
 * playlist/section в entities): валидатор проповеди живёт в entities/sermon.
 */
export const playlistSchema = z.object({
  artwork: z.string().nullable(),
  description: z.string().optional(),
  id: z.string(),
  sections: z.lazy((): z.ZodType<SectionDataDef[]> => z.array(sectionSchema)).optional(),
  sermons: z.array(z.custom<SermonShape>()),
  title: z.string(),
})

/** Тип плейлиста (извлекается из схемы). */
export type PlaylistData = z.infer<typeof playlistSchema>

/** Схема для массива плейлистов (PlaylistData[]). */
export const playlistsArraySchema = z.array(playlistSchema)

// Алиас для обратной совместимости
export const playlistDataSchema = playlistSchema
