import { useEffect, useState } from 'react'
import { type APITypes, usersApi } from 'shared/api'
import { reportError } from 'shared/model/error-dialog'

export interface AdminUserEntityState {
  isLoading: boolean
  isNotFound: boolean
  user: APITypes.UserResponse | null
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить пользователя'

/**
 * Загрузка одного пользователя для формы редактирования (стабильные пропсы).
 * @param id — идентификатор пользователя.
 */
export const useAdminUserEntity = (id: string): AdminUserEntityState => {
  const [user, setUser] = useState<APITypes.UserResponse | null>(null)
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
        const entity = await usersApi.getUsers().usersControllerFindOne(id)
        if (isActive) setUser(entity)
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

  return { isLoading, isNotFound, user }
}
