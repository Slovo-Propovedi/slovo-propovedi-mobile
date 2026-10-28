import { useAction } from '@reatom/npm-react'
import { useCallback, useState } from 'react'
import { type APITypes, playlistsApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { useSilentRefetchOnFocus } from 'shared/lib/hooks/useSilentRefetchOnFocus'
import { useCacheFirstEntity } from 'shared/lib/session-cache'
import { hasOrderChanged } from 'shared/lib/utils/hasOrderChanged'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { playlistDetailCache } from './playlistDetailCache'

export interface AdminPlaylistDetailState {
  isDeleting: boolean
  isNotFound: boolean
  isReordering: boolean
  playlist: APITypes.PlaylistEntity | null
  refresh: () => Promise<void>
  remove: () => Promise<boolean>
  reorder: (nextOrder: APITypes.PlaylistSermon[]) => Promise<void>
  sermons: APITypes.PlaylistSermon[]
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить плейлист'
const REORDER_ERROR_MESSAGE = 'Не удалось сохранить порядок проповедей'

/**
 * Деталь плейлиста: загрузка, reorder проповедей и удаление.
 * @param id — идентификатор плейлиста.
 */
export const useAdminPlaylistDetail = (id: string): AdminPlaylistDetailState => {
  const showToastAction = useAction(showToast)
  const [playlist, setPlaylist] = useState<APITypes.PlaylistEntity | null>(null)
  const [sermons, setSermons] = useState<APITypes.PlaylistSermon[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isNotFound, setIsNotFound] = useState(false)
  const [isReordering, setIsReordering] = useState(false)

  const fetchPlaylist = useCallback(
    () =>
      playlistDetailCache.fetchThrough(id, () =>
        playlistsApi.getPlaylists().playlistControllerFindOne(id),
      ),
    [id],
  )

  // Silent reload used after mutations and on focus: keeps the current entity on
  // screen (no skeleton, no not-found flip) and reports network errors only.
  const refresh = useCallback(async () => {
    if (!id) return

    try {
      const entity = await fetchPlaylist()
      setPlaylist(entity)
      setSermons(entity.sermons)
    } catch (error) {
      reportError(error, LOAD_ERROR_MESSAGE)
    }
  }, [fetchPlaylist, id])

  useCacheFirstEntity({
    cache: playlistDetailCache,
    errorMessage: LOAD_ERROR_MESSAGE,
    fetcher: fetchPlaylist,
    id,
    onLoaded: entity => {
      setPlaylist(entity)
      setSermons(entity.sermons)
    },
    onNotFound: () => setIsNotFound(true),
  })

  useSilentRefetchOnFocus(refresh)

  const reorder = useCallback(
    async (nextOrder: APITypes.PlaylistSermon[]) => {
      const previousOrder = sermons
      setSermons(nextOrder)

      if (!hasOrderChanged(previousOrder, nextOrder)) return

      setIsReordering(true)
      try {
        await playlistsApi
          .getPlaylists()
          .reorderSermonsInPlaylist(id, { sermonIds: nextOrder.map(sermon => sermon.id) })
      } catch (error) {
        setSermons(previousOrder)
        showToastAction(getErrorMessage(error) || REORDER_ERROR_MESSAGE)
      } finally {
        setIsReordering(false)
      }
    },
    [id, sermons, showToastAction],
  )

  const remove = useCallback(async () => {
    setIsDeleting(true)
    try {
      await playlistsApi.getPlaylists().playlistControllerRemove(id)
      return true
    } catch (error) {
      reportError(error, 'Не удалось удалить плейлист')
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [id])

  return { isDeleting, isNotFound, isReordering, playlist, refresh, remove, reorder, sermons }
}
