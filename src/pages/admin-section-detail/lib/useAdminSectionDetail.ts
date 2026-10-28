import { useAction } from '@reatom/npm-react'
import { useCallback, useState } from 'react'
import { type APITypes, sectionsApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { useSilentRefetchOnFocus } from 'shared/lib/hooks/useSilentRefetchOnFocus'
import { useCacheFirstEntity } from 'shared/lib/session-cache'
import { hasOrderChanged } from 'shared/lib/utils/hasOrderChanged'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { sectionDetailCache } from './sectionDetailCache'

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

  const fetchSection = useCallback(
    () =>
      sectionDetailCache.fetchThrough(id, () =>
        sectionsApi.getSections().sectionControllerFindOne(id),
      ),
    [id],
  )

  useCacheFirstEntity({
    cache: sectionDetailCache,
    errorMessage: LOAD_ERROR_MESSAGE,
    fetcher: fetchSection,
    id,
    onLoaded: entity => {
      setSection(entity)
      setPlaylists(entity.playlists)
    },
    onNotFound: () => setIsNotFound(true),
  })

  useSilentRefetchOnFocus(
    useCallback(async () => {
      if (!id) return

      try {
        const entity = await fetchSection()
        setSection(entity)
        setPlaylists(entity.playlists)
      } catch (error) {
        reportError(error, LOAD_ERROR_MESSAGE)
      }
    }, [fetchSection, id]),
  )

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
