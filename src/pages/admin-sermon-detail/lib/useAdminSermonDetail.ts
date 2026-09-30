import { useCallback, useEffect, useState } from 'react'
import { type APITypes, sermonsApi } from 'shared/api'
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

  useEffect(() => {
    let isActive = true

    const load = async () => {
      if (!id) {
        setIsNotFound(true)
        return
      }

      try {
        const entity = await sermonsApi.getSermons().sermonControllerFindOne(id)
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
  }, [id])

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
