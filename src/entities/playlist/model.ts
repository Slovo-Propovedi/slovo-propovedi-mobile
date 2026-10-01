import { action, atom } from '@reatom/framework'
import z from 'zod'
import { sectionSchema } from 'entities/section/@x/playlist'
import { getCachedJson } from 'shared/lib/cache'
import { type SectionShape, type SermonShape } from 'shared/model'
import {
  FAVORITES_PLAYLIST,
  type LocalPlaylistData,
  MY_PLAYLISTS,
  myPlaylistsArraySchema,
  withFavoritesFirst,
} from './localPlaylists'
import { persistMyPlaylists } from './localPlaylistStorage'

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

export const myPlaylistsAtom = atom<LocalPlaylistData[]>([FAVORITES_PLAYLIST], 'myPlaylistsAtom')

// Storage is untrusted and may reject (broken native module, quota, …). A
// rejection must never surface to callers — `MyPlaylistsSlider` fires the action
// fire-and-forget (`void loadPlaylists()`) — so any failure degrades to the
// same "no stored data" path the invalid-JSON case already takes.
const readStoredMyPlaylists = async (): Promise<LocalPlaylistData[]> => {
  try {
    const stored = await getCachedJson(MY_PLAYLISTS, myPlaylistsArraySchema)
    const playlists = withFavoritesFirst(stored ?? [])
    if (!stored) await persistMyPlaylists(playlists)
    return playlists
  } catch (error) {
    console.error('[loadMyPlaylists] failed to hydrate from storage:', error)
    return [FAVORITES_PLAYLIST]
  }
}

/**
 * Гидратация локальных плейлистов из AsyncStorage.
 *
 * Хранилище недоверенное: читается через zod (`myPlaylistsArraySchema`),
 * невалидные данные трактуются как отсутствующие. При первом чтении
 * (ключ отсутствует) засеивается `FAVORITES_PLAYLIST`. Отказ самого
 * хранилища (reject) логируется и трактуется так же — как отсутствие данных.
 */
export const loadMyPlaylists = action(async ctx => {
  const playlists = await readStoredMyPlaylists()
  await ctx.schedule(() => {
    myPlaylistsAtom(ctx, playlists)
  })
  return playlists
}, 'loadMyPlaylists')

/**
 * Переупорядочивание локальных плейлистов (drag-and-drop на экране «Мои плейлисты»).
 *
 * Сохраняет новый порядок в `myPlaylists` (локально, без сервера) и коммитит
 * его в `myPlaylistsAtom`. `orderedIds` — желаемый порядок id; «Избранные»
 * пинятся первыми через `withFavoritesFirst`, поэтому их нельзя сдвинуть с
 * первой позиции. Неизвестные id молча отбрасываются, а id, присутствующие в
 * атоме, но отсутствующие в `orderedIds`, дописываются в конец — конкурентное
 * добавление плейлиста не теряется.
 *
 * Чтение атома → вычисление `nextPlaylists` → коммит идут без `await` между
 * ними, поэтому конкурентные операции не теряют изменения друг друга.
 *
 * Запись в хранилище может отклониться (сломанный нативный модуль, квота, …);
 * такой отказ логируется, но атом уже закоммичен — та же политика деградации,
 * что и у `readStoredMyPlaylists`.
 */
export const reorderMyPlaylists = action(async (ctx, orderedIds: string[]) => {
  const byId = new Map(ctx.get(myPlaylistsAtom).map(playlist => [playlist.id, playlist]))
  const ordered = orderedIds.flatMap(id => {
    const playlist = byId.get(id)
    return playlist ? [playlist] : []
  })
  const seen = new Set(ordered.map(playlist => playlist.id))
  const missing = [...byId.values()].filter(playlist => !seen.has(playlist.id))
  const nextPlaylists = withFavoritesFirst([...ordered, ...missing])
  await ctx.schedule(() => {
    myPlaylistsAtom(ctx, nextPlaylists)
  })
  try {
    await persistMyPlaylists(nextPlaylists)
  } catch (error) {
    console.error('[reorderMyPlaylists] failed to persist order:', error)
  }
  return nextPlaylists
}, 'reorderMyPlaylists')
