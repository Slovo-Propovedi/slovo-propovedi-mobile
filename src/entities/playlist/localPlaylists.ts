import z from 'zod'
import { type SermonShape } from 'shared/model'
import { localSermonSchema } from './lib/localSermonSchema'

/** Ключ AsyncStorage для локальных плейлистов. */
export const MY_PLAYLISTS = 'myPlaylists'

/**
 * Черновик локального плейлиста на границе хранилища.
 *
 * `sermons`/`sermonIds` необязательны: старые записи содержали только
 * `sermonIds`, а самые ранние — только `id`/`title`. Канонический вид
 * (`LocalPlaylistData`) получается через `normalizeLocalPlaylist`.
 */
const localPlaylistDraftSchema = z.object({
  id: z.string(),
  sermonIds: z.array(z.string()).optional(),
  sermons: z.array(localSermonSchema).optional(),
  title: z.string(),
})

export const myPlaylistsArraySchema = z.array(localPlaylistDraftSchema)

/**
 * Канонический локальный (созданный пользователем) плейлист.
 *
 * Хранит снапшоты проповедей (`sermons`), а не только id: снапшот делает
 * плейлист рендерящимся и проигрываемым офлайн, без обращения к каталогу.
 * `sermonIds` — производное от `sermons` (durable для совместимости чтения).
 */
export interface LocalPlaylistData {
  id: string
  sermonIds: string[]
  sermons: SermonShape[]
  title: string
}

/**
 * Приводит прочитанные (недоверенные) данные плейлиста к каноническому виду.
 *
 * Снапшоты выигрывают у legacy `sermonIds`: если `sermons` есть, ids выводятся
 * из них, а unmatched legacy ids молча отбрасываются. Если снапшотов нет (старая
 * запись), плейлист остаётся пустым — рендерить по одним id нечем.
 * @param playlist - Сырые данные из схемы (untrusted).
 * @returns Плейлист с гарантированными `sermons` и производными `sermonIds`.
 */
export const normalizeLocalPlaylist = (
  playlist: z.infer<typeof localPlaylistDraftSchema>,
): LocalPlaylistData => {
  const sermons = playlist.sermons ?? []
  return {
    id: playlist.id,
    sermonIds: sermons.map(sermon => sermon.id),
    sermons,
    title: playlist.title,
  }
}

// Плоский id: серверные id — UUID, столкновение с `favorites` невозможно.
const FAVORITES_PLAYLIST_ID = 'favorites'

/** Плейлист «Избранные»: всегда присутствует и стоит первым в списке. */
export const FAVORITES_PLAYLIST: LocalPlaylistData = {
  id: FAVORITES_PLAYLIST_ID,
  sermonIds: [],
  sermons: [],
  title: 'Избранные',
}

// Приводит список к инварианту «Избранные всегда первые».
//
// Первое stored-«Избранное» сохраняется как есть (его снапшоты не теряются при
// гидратации и reorder); пустая константа — только фолбэк, когда записи нет.
// Дубликаты favorites id отбрасываются: побеждает первый.
export const withFavoritesFirst = (playlists: LocalPlaylistData[]): LocalPlaylistData[] => {
  const storedFavorites = playlists.find(playlist => playlist.id === FAVORITES_PLAYLIST_ID)
  const others = playlists.filter(playlist => playlist.id !== FAVORITES_PLAYLIST_ID)
  return [storedFavorites ?? FAVORITES_PLAYLIST, ...others]
}
