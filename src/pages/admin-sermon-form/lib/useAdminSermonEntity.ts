import { useEffect, useState } from 'react'
import { type APITypes, sermonsApi } from 'shared/api'
import { reportError } from 'shared/model/error-dialog'

export interface AdminSermonEntityState {
  isLoading: boolean
  isNotFound: boolean
  sermon: APITypes.SermonEntity | null
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить проповедь'

/**
 * Загрузка одной проповеди для формы редактирования (стабильные пропсы формы).
 * @param id — идентификатор проповеди.
 */
export const useAdminSermonEntity = (id: string): AdminSermonEntityState => {
  const [sermon, setSermon] = useState<APITypes.SermonEntity | null>(null)
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
        const entity = await sermonsApi.getSermons().sermonControllerFindOne(id)
        if (isActive) setSermon(entity)
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

  return { isLoading, isNotFound, sermon }
}
