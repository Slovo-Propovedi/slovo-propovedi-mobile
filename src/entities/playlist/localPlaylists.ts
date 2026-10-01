import z from 'zod'

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

export type LocalPlaylistData = z.infer<typeof localPlaylistDataSchema>

export const myPlaylistsArraySchema = z.array(localPlaylistDataSchema)

/** Ключ AsyncStorage для локальных плейлистов. */
export const MY_PLAYLISTS = 'myPlaylists'

// Плоский id: серверные id — UUID, столкновение с `favorites` невозможно.
const FAVORITES_PLAYLIST_ID = 'favorites'

/** Плейлист «Избранные»: всегда присутствует и стоит первым в списке. */
export const FAVORITES_PLAYLIST: LocalPlaylistData = {
  id: FAVORITES_PLAYLIST_ID,
  sermonIds: [],
  title: 'Избранные',
}

// Приводит список к инварианту «Избранные всегда первые».
export const withFavoritesFirst = (playlists: LocalPlaylistData[]): LocalPlaylistData[] => [
  FAVORITES_PLAYLIST,
  ...playlists.filter(playlist => playlist.id !== FAVORITES_PLAYLIST_ID),
]
