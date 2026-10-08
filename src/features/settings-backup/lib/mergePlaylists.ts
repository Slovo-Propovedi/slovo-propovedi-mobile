import { FAVORITES_PLAYLIST, type LocalPlaylistData, withFavoritesFirst } from 'entities/playlist'

type SermonSnapshots = LocalPlaylistData['sermons']

// Импортированные снапшоты выигрывают у локальных при совпадении id проповеди.
const mergeSermons = (local: SermonSnapshots, imported: SermonSnapshots): SermonSnapshots => {
  const byId = new Map<string, SermonSnapshots[number]>(
    local.map(sermon => [sermon.id, sermon] as const),
  )
  for (const sermon of imported) byId.set(sermon.id, sermon)

  return [...byId.values()]
}

// Держит инвариант `sermonIds = sermons.map(id)`, который ожидают читатели.
const toCanonical = (playlist: LocalPlaylistData): LocalPlaylistData => {
  const sermons = playlist.sermons
  return { ...playlist, sermonIds: sermons.map(sermon => sermon.id), sermons }
}

/**
 * Объединяет импортированные локальные плейлисты с текущими.
 *
 * Плейлисты объединяются по id (импортированный выигрывает по названию),
 * проповеди внутри — по id (импортированная выигрывает), после чего список
 * приводится к инварианту «Избранные первыми» и «Избранные существуют».
 * @param local - Текущие локальные плейлисты.
 * @param imported - Плейлисты из файла резервной копии.
 */
export const mergePlaylists = (
  local: LocalPlaylistData[],
  imported: LocalPlaylistData[],
): LocalPlaylistData[] => {
  const byId = new Map<string, LocalPlaylistData>(
    local.map(playlist => [playlist.id, playlist] as const),
  )

  for (const playlist of imported) {
    const existing = byId.get(playlist.id)
    if (!existing) {
      byId.set(playlist.id, playlist)
      continue
    }

    byId.set(
      playlist.id,
      toCanonical({
        ...existing,
        sermons: mergeSermons(existing.sermons, playlist.sermons),
        title: playlist.title,
      }),
    )
  }

  if (!byId.has(FAVORITES_PLAYLIST.id)) byId.set(FAVORITES_PLAYLIST.id, FAVORITES_PLAYLIST)

  return withFavoritesFirst([...byId.values()].map(toCanonical))
}
