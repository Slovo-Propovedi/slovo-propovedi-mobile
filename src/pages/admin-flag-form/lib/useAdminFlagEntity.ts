import { useEffect, useState } from 'react'
import { type APITypes, featureFlagsApi } from 'shared/api'
import { reportError } from 'shared/model/error-dialog'

export interface AdminFlagEntityState {
  flag: APITypes.FeatureFlag | null
  isLoading: boolean
  isNotFound: boolean
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить фича-флаг'

/**
 * Загрузка одного фича-флага для формы редактирования (стабильные пропсы).
 * Отдельного `GET /feature-flags/{id}` нет — флаг выбирается из общего списка.
 * @param id — идентификатор флага.
 */
export const useAdminFlagEntity = (id: string): AdminFlagEntityState => {
  const [flag, setFlag] = useState<APITypes.FeatureFlag | null>(null)
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
        const response = await featureFlagsApi.getFeatureFlags().featureFlagsControllerFindAll()
        const entity = response.flags.find(item => item.id === id) ?? null
        if (!isActive) return

        if (entity) setFlag(entity)
        else setIsNotFound(true)
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

  return { flag, isLoading, isNotFound }
}
