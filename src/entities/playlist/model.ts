import { action, atom } from '@reatom/framework'
import z from 'zod'
import { sectionSchema } from 'entities/section/@x/playlist'
import { getCachedJson, setCachedJson } from 'shared/lib/cache'
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
export const playlistDataSchema = z.object({
  artwork: z.string().nullable(),
  description: z.string().optional(),
  id: z.string(),
  sections: z.lazy((): z.ZodType<SectionShape[]> => z.array(sectionSchema)).optional(),
  sermons: z.array(z.custom<SermonShape>(isSermonShape)),
  title: z.string(),
})

/** Тип плейлиста (извлекается из схемы). */
export type PlaylistData = z.infer<typeof playlistDataSchema>

/** Схема для массива плейлистов (PlaylistData[]). */
export const playlistsArraySchema = z.array(playlistDataSchema)

/**
 * Локальный (созданный пользователем) плейлист.
 *
 * Хранит только id проповедей, а не их снапшоты: полные `SermonData`
 * резолвятся по id на экране плейлиста (секции/кэш/сеть). `sermonIds`
 * позволяет переживать обновления каталога.
 */
const localPlaylistDataSchema = z.object({
  id: z.string(),
  sermonIds: z.array(z.string()),
  title: z.string(),
})

type LocalPlaylistData = z.infer<typeof localPlaylistDataSchema>

const myPlaylistsArraySchema = z.array(localPlaylistDataSchema)

/** Ключ AsyncStorage для локальных плейлистов. */
const MY_PLAYLISTS = 'myPlaylists'

// Плоский id: серверные id — UUID, столкновение с `favorites` невозможно.
const FAVORITES_PLAYLIST_ID = 'favorites'

/** Плейлист «Избранные»: всегда присутствует и стоит первым в списке. */
export const FAVORITES_PLAYLIST: LocalPlaylistData = {
  id: FAVORITES_PLAYLIST_ID,
  sermonIds: [],
  title: 'Избранные',
}

export const myPlaylistsAtom = atom<LocalPlaylistData[]>([FAVORITES_PLAYLIST], 'myPlaylistsAtom')

// Приводит список к инварианту «Избранные всегда первые».
const withFavoritesFirst = (playlists: LocalPlaylistData[]): LocalPlaylistData[] => [
  FAVORITES_PLAYLIST,
  ...playlists.filter(playlist => playlist.id !== FAVORITES_PLAYLIST_ID),
]

const persistMyPlaylists = (playlists: LocalPlaylistData[]) =>
  setCachedJson(MY_PLAYLISTS, playlists)

/**
 * Гидратация локальных плейлистов из AsyncStorage.
 *
 * Хранилище недоверенное: читается через zod (`myPlaylistsArraySchema`),
 * невалидные данные трактуются как отсутствующие. При первом чтении
 * (ключ отсутствует) засеивается `FAVORITES_PLAYLIST`.
 */
export const loadMyPlaylists = action(async ctx => {
  const stored = await getCachedJson(MY_PLAYLISTS, myPlaylistsArraySchema)
  const playlists = withFavoritesFirst(stored ?? [])
  if (!stored) await persistMyPlaylists(playlists)
  await ctx.schedule(() => {
    myPlaylistsAtom(ctx, playlists)
  })
  return playlists
}, 'loadMyPlaylists')
