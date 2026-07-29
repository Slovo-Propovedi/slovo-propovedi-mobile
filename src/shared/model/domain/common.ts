import z from 'zod'

/**
 * Доменные типы приложения.
 * Все типы извлекаются из Zod схем в этом файле.
 * Схемы структурно совпадают с API-типами (APITypes),
 * поэтому данные с сервера можно использовать без преобразования.
 * Zod используется для валидации данных при восстановлении из AsyncStorage.
 */

/** Интерфейс для плейлиста (PlaylistData). Используется для опережающего объявления типов. */
interface PlaylistDataDef {
  artwork: string
  description?: string | undefined
  id: string
  sections?: SectionDataDef[] | undefined
  sermons: SermonDataDef[]
  title: string
}

/** Интерфейс для секции (SectionData). Используется для опережающего объявления типов. */
interface SectionDataDef {
  borderRadius?: boolean | undefined
  description?: null | string | undefined
  id?: string | undefined
  isDescriptionTitleOnSlideLarge?: boolean | undefined
  itemsRows?: null | number | undefined
  itemsSize: 'bothOnAndUnder' | 'large' | 'middle' | 'on' | 'small' | 'under' | 'xLarge'
  playlists?: PlaylistDataDef[] | undefined
  title?: string | undefined
  transform: 'high' | 'middle' | 'short'
  whereIsSlideTitleLocated?: 'bothOnAndUnder' | 'on' | 'under' | undefined
}

/** Интерфейс для проповеди (SermonData). Используется для опережающего объявления типов. */
interface SermonDataDef {
  artist: string
  artwork: string
  audioUrl?: null | string | undefined
  chapter?: null | number | undefined
  description?: string | undefined
  id: string
  playlists?: PlaylistDataDef[] | undefined
  textFileUrl?: null | string | undefined
  title: string
  verse?: null | number | number[] | undefined
  youtubeUrl?: null | string | undefined
}

/** Схема для секции (SectionData). */
export const sectionSchema = z.object({
  borderRadius: z.boolean().optional(),
  description: z.string().nullable().optional(),
  id: z.string().optional(),
  isDescriptionTitleOnSlideLarge: z.boolean().optional(),
  itemsRows: z.number().nullable().optional(),
  itemsSize: z.enum(['bothOnAndUnder', 'large', 'middle', 'on', 'small', 'under', 'xLarge']),
  playlists: z.lazy((): z.ZodType<PlaylistDataDef[]> => z.array(playlistSchema)).optional(),
  title: z.string().optional(),
  transform: z.enum(['high', 'short', 'middle']),
  whereIsSlideTitleLocated: z.enum(['bothOnAndUnder', 'on', 'under']).optional(),
})

/** Тип секции (извлекается из схемы). */
export type SectionData = z.infer<typeof sectionSchema>

/** Схема для проповеди (SermonData). */
export const sermonSchema = z.object({
  artist: z.string(),
  artwork: z.string(),
  audioUrl: z.string().nullable().optional(),
  chapter: z.number().nullish(),
  description: z.string().optional(),
  id: z.string(),
  playlists: z.lazy((): z.ZodType<PlaylistDataDef[]> => z.array(playlistSchema)).optional(),
  textFileUrl: z.string().nullable().optional(),
  title: z.string(),
  verse: z
    .union([z.number(), z.array(z.number())])
    .nullable()
    .optional(),
  youtubeUrl: z.string().nullable().optional(),
})

/** Тип проповеди (извлекается из схемы). */
export type SermonData = z.infer<typeof sermonSchema>

/** Схема для плейлиста (PlaylistData). */
export const playlistSchema = z.object({
  artwork: z.string(),
  description: z.string().optional(),
  id: z.string(),
  sections: z.lazy((): z.ZodType<SectionDataDef[]> => z.array(sectionSchema)).optional(),
  sermons: z.array(sermonSchema),
  title: z.string(),
})

/** Тип плейлиста (извлекается из схемы). */
export type PlaylistData = z.infer<typeof playlistSchema>

/** Схема для книги (BookData). Книга - это тоже проповедь. */
export const bookSchema = sermonSchema

/** Тип книги (извлекается из схемы). */
export type BookData = SermonData

/** Схема для массива книг (BookData[]). */
export const booksArraySchema = z.array(bookSchema)

/** Схема для массива плейлистов (PlaylistData[]). */
export const playlistsArraySchema = z.array(playlistSchema)

// Алиасы для обратной совместимости
export const sermonDataSchema = sermonSchema
export const playlistDataSchema = playlistSchema
export const bookDataSchema = bookSchema
