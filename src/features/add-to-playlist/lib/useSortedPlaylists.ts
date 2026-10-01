import { useAtom } from '@reatom/npm-react'
import { useMemo } from 'react'
import { type LocalPlaylistData, myPlaylistsAtom } from 'entities/playlist'

export interface PlaylistMembership {
  isContained: boolean
  playlist: LocalPlaylistData
}

/**
 * Держит список плейлистов с флагом принадлежности проповеди и сортирует его:
 * плейлисты, содержащие проповедь, идут первыми, остальные — после. Внутри
 * каждой группы сохраняется порядок `myPlaylistsAtom`, поэтому «Избранные»
 * (запиннены первыми в атоме) остаются первыми и в своей группе.
 *
 * Подписка на атом даёт «живой» чекбокс: коммит `togglePlaylistSermon`
 * мгновенно отражается в UI.
 * @param sermonId - Id проповеди, чью принадлежность показываем.
 */
export const useSortedPlaylists = (sermonId: string): PlaylistMembership[] => {
  const [playlists] = useAtom(myPlaylistsAtom)

  return useMemo(() => {
    const entries = playlists.map(playlist => ({
      isContained: playlist.sermonIds.includes(sermonId),
      playlist,
    }))
    const contained = entries.filter(entry => entry.isContained)
    const rest = entries.filter(entry => !entry.isContained)
    return [...contained, ...rest]
  }, [playlists, sermonId])
}
