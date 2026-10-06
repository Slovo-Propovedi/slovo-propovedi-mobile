import { useCallback, useEffect, useState } from 'react'
import { type APITypes, sermonsApi } from 'shared/api'
import { useSilentRefetchOnFocus } from 'shared/lib/hooks/useSilentRefetchOnFocus'
import { reportError } from 'shared/model/error-dialog'

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

  const fetchSermon = useCallback(() => sermonsApi.getSermons().sermonControllerFindOne(id), [id])

  useEffect(() => {
    let isActive = true

    const load = async () => {
      if (!id) {
        if (isActive) setIsNotFound(true)
        return
      }

      try {
        const entity = await fetchSermon()
        if (isActive) setSermon(entity)
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
  }, [fetchSermon, id])

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
