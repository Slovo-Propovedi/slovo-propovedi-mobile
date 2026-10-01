import { useAction, useAtom } from '@reatom/npm-react'
import { myPlaylistsAtom, reorderMyPlaylists } from 'entities/playlist'
import { hasOrderChanged } from 'shared/lib/utils/hasOrderChanged'

/**
 * Обёртка drag-to-reorder для экрана «Мои плейлисты».
 *
 * `playlists` — снимок порядка на момент рендера; сам `reorderMyPlaylists`
 * перечитывает актуальный `myPlaylistsAtom` в момент срабатывания, поэтому
 * снимок используется только для проверки «порядок не изменился» (no-op).
 */
export const useReorderMyPlaylists = () => {
  const reorder = useAction(reorderMyPlaylists)
  const [playlists] = useAtom(myPlaylistsAtom)

  return (orderedIds: string[]) => {
    if (
      !hasOrderChanged(
        playlists,
        orderedIds.map(id => ({ id })),
      )
    )
      return

    void reorder(orderedIds)
  }
}
