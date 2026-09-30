import { useEffect, useState } from 'react'
import { type APITypes, playlistsApi } from 'shared/api'
import { reportError } from 'shared/model/error-dialog'

export interface AdminPlaylistEntityState {
  isLoading: boolean
  isNotFound: boolean
  playlist: APITypes.PlaylistEntity | null
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить плейлист'

/**
 * Загрузка одного плейлиста для формы редактирования (стабильные пропсы формы).
 * @param id — идентификатор плейлиста.
 */
export const useAdminPlaylistEntity = (id: string): AdminPlaylistEntityState => {
  const [playlist, setPlaylist] = useState<APITypes.PlaylistEntity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      if (!id) {
        setIsNotFound(true)
        setIsLoading(false)
        return
      }

      try {
        const entity = await playlistsApi.getPlaylists().playlistControllerFindOne(id)
        if (isActive) setPlaylist(entity)
      } catch (error) {
        if (isActive) {
          setIsNotFound(true)
          reportError(error, LOAD_ERROR_MESSAGE)
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [id])

  return { isLoading, isNotFound, playlist }
}
