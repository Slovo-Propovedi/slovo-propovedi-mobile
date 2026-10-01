import { useAction, useAtom } from '@reatom/npm-react'
import { myPlaylistsAtom, reorderMyPlaylists } from 'entities/playlist'
import { hasOrderChanged } from 'shared/lib/utils/hasOrderChanged'

/**
 * Обёртка drag-to-reorder для секции «Мои плейлисты».
 *
 * Читает актуальный порядок из `myPlaylistsAtom` в момент конца drag — список
 * меняется асинхронно после гидратации, поэтому снимок при рендере устаревает.
 * Пустой drag (порядок не изменился) — no-op.
 */
export const useReorderPlaylists = () => {
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
