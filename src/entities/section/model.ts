import { atom } from '@reatom/framework'
import z from 'zod'
import { type PlaylistShape } from 'shared/model'

/**
 * Схема секции (SectionData).
 *
 * Поле playlists остаётся структурной границей с entities/playlist, чтобы
 * section и playlist не образовали require-цикл. Аннотация `PlaylistShape[]`
 * не даёт типам замкнуться друг на друга (см. Docs/architecture.md).
 */
export const sectionSchema = z.object({
  borderRadius: z.boolean().optional(),
  description: z.string().nullable().optional(),
  id: z.string().optional(),
  isDescriptionTitleOnSlideLarge: z.boolean().optional(),
  itemsRows: z.number().nullable().optional(),
  itemsSize: z.enum(['large', 'middle', 'small', 'xLarge']),
  playlists: z
    .lazy((): z.ZodType<PlaylistShape[]> => z.array(z.custom<PlaylistShape>()))
    .optional(),
  title: z.string().optional(),
  transform: z.enum(['high', 'short', 'middle']),
  whereIsSlideTitleLocated: z.enum(['bothOnAndUnder', 'on', 'under']).optional(),
})

/** Тип секции (извлекается из схемы). */
export type SectionData = z.infer<typeof sectionSchema>

/** Схема массива секций (SectionData[]) — для валидации кэша. */
export const sectionsArraySchema = z.array(sectionSchema)

export const dynamicSectionsAtom = atom<SectionData[]>([], 'dynamicSectionsAtom')
export const isLoadingSectionsAtom = atom(true, 'isLoadingSectionsAtom')

export type SectionDataSource = 'cache' | 'network' | 'unknown'
export const sectionDataSourceAtom = atom<SectionDataSource>('unknown', 'sectionDataSourceAtom')
