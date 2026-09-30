import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { authUserAtom } from 'entities/auth'
import { type APITypes, usersApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'

export interface AdminUserDetailState {
  changePassword: (password: string) => Promise<boolean>
  isChangingPassword: boolean
  isDeleting: boolean
  isNotFound: boolean
  isOwnAccount: boolean
  remove: () => Promise<boolean>
  user: APITypes.UserResponse | null
}

const PASSWORD_CHANGED_MESSAGE = 'Пароль изменён'
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить пользователя'

/**
 * Деталь пользователя: загрузка, удаление и смена пароля. Удаление собственного
 * аккаунта скрыто в UI (`isOwnAccount`) — дублирует серверную защиту self-delete.
 * @param id — идентификатор пользователя.
 */
export const useAdminUserDetail = (id: string): AdminUserDetailState => {
  const showToastAction = useAction(showToast)
  const [currentUser] = useAtom(authUserAtom)
  const [user, setUser] = useState<APITypes.UserResponse | null>(null)
  const [isNotFound, setIsNotFound] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      if (!id) {
        setIsNotFound(true)
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
      await usersApi.getUsers().usersControllerRemove(id)
      return true
    } catch (error) {
      reportError(error, 'Не удалось удалить пользователя')
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [id])

  const changePassword = useCallback(
    async (password: string) => {
      setIsChangingPassword(true)
      try {
        await usersApi.getUsers().usersControllerChangePassword(id, { password })
        showToastAction(PASSWORD_CHANGED_MESSAGE)
        return true
      } catch (error) {
        showToastAction(getErrorMessage(error))
        return false
      } finally {
        setIsChangingPassword(false)
      }
    },
    [id, showToastAction],
  )

  return {
    changePassword,
    isChangingPassword,
    isDeleting,
    isNotFound,
    isOwnAccount: currentUser?.id === id,
    remove,
    user,
  }
}
