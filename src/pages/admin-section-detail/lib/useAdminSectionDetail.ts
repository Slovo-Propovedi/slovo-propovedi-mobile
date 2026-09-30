import { useAction } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { type APITypes, sectionsApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { hasOrderChanged } from 'shared/lib/utils/hasOrderChanged'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'

export interface AdminSectionDetailState {
  isDeleting: boolean
  isNotFound: boolean
  isReordering: boolean
  playlists: APITypes.SectionPlaylist[]
  remove: () => Promise<boolean>
  reorder: (nextOrder: APITypes.SectionPlaylist[]) => Promise<void>
  section: APITypes.SectionEntity | null
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить раздел'
const REORDER_ERROR_MESSAGE = 'Не удалось сохранить порядок плейлистов'

/**
 * Деталь раздела: загрузка, reorder плейлистов и удаление.
 * @param id — идентификатор раздела.
 */
export const useAdminSectionDetail = (id: string): AdminSectionDetailState => {
  const showToastAction = useAction(showToast)
  const [section, setSection] = useState<APITypes.SectionEntity | null>(null)
  const [playlists, setPlaylists] = useState<APITypes.SectionPlaylist[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isNotFound, setIsNotFound] = useState(false)
  const [isReordering, setIsReordering] = useState(false)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      if (!id) {
        setIsNotFound(true)
        return
      }

      try {
        const entity = await sectionsApi.getSections().sectionControllerFindOne(id)
        if (!isActive) return
        setSection(entity)
        setPlaylists(entity.playlists)
      } catch (error) {
        if (isActive) {
          setIsNotFound(true)
          reportError(error, LOAD_ERROR_MESSAGE)
        }
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [id])

  const reorder = useCallback(
    async (nextOrder: APITypes.SectionPlaylist[]) => {
      const previousOrder = playlists
      setPlaylists(nextOrder)

      if (!hasOrderChanged(previousOrder, nextOrder)) return

      setIsReordering(true)
      try {
        await sectionsApi
          .getSections()
          .reorderPlaylistsInSection(id, { playlistIds: nextOrder.map(p => p.id) })
      } catch (error) {
        setPlaylists(previousOrder)
        showToastAction(getErrorMessage(error) || REORDER_ERROR_MESSAGE)
      } finally {
        setIsReordering(false)
      }
    },
    [id, playlists, showToastAction],
  )

  const remove = useCallback(async () => {
    setIsDeleting(true)
    try {
      await sectionsApi.getSections().sectionControllerRemove(id)
      return true
    } catch (error) {
      reportError(error, 'Не удалось удалить раздел')
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [id])

  return { isDeleting, isNotFound, isReordering, playlists, remove, reorder, section }
}
