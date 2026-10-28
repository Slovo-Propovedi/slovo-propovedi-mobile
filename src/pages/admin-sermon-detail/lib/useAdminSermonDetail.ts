import { useCallback, useState } from 'react'
import { type APITypes, sermonsApi } from 'shared/api'
import { useSilentRefetchOnFocus } from 'shared/lib/hooks/useSilentRefetchOnFocus'
import { useCacheFirstEntity } from 'shared/lib/session-cache'
import { reportError } from 'shared/model/error-dialog'
import { sermonDetailCache } from './sermonDetailCache'

export interface AdminSermonDetailState {
  isDeleting: boolean
  isNotFound: boolean
  remove: () => Promise<boolean>
  sermon: APITypes.SermonEntity | null
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить проповедь'
const REMOVE_ERROR_MESSAGE = 'Не удалось удалить проповедь'

/**
 * Деталь проповеди: загрузка и удаление.
 * @param id — идентификатор проповеди.
 */
export const useAdminSermonDetail = (id: string): AdminSermonDetailState => {
  const [sermon, setSermon] = useState<APITypes.SermonEntity | null>(null)
  const [isNotFound, setIsNotFound] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchSermon = useCallback(
    () =>
      sermonDetailCache.fetchThrough(id, () => sermonsApi.getSermons().sermonControllerFindOne(id)),
    [id],
  )

  useCacheFirstEntity({
    cache: sermonDetailCache,
    errorMessage: LOAD_ERROR_MESSAGE,
    fetcher: fetchSermon,
    id,
    onLoaded: setSermon,
    onNotFound: () => setIsNotFound(true),
  })

  useSilentRefetchOnFocus(
    useCallback(async () => {
      if (!id) return

      try {
        setSermon(await fetchSermon())
      } catch (error) {
        reportError(error, LOAD_ERROR_MESSAGE)
      }
    }, [fetchSermon, id]),
  )

  const remove = useCallback(async () => {
    setIsDeleting(true)
    try {
      await sermonsApi.getSermons().sermonControllerRemove(id)
      return true
    } catch (error) {
      reportError(error, REMOVE_ERROR_MESSAGE)
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [id])

  return { isDeleting, isNotFound, remove, sermon }
}
