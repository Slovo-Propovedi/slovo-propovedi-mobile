import { type LocalPlaylistData } from 'entities/playlist'

// Порядок строк из режима редактирования: неизвестные id (конкурентно
// добавленный плейлист) уезжают в конец, известные сортируются по позиции.
export const sortByLocalOrder = (playlists: LocalPlaylistData[], orderedIds: string[]) => {
  const rank = new Map(orderedIds.map((id, index) => [id, index]))
  return [...playlists].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity))
}
