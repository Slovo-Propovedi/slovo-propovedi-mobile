import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useState } from 'react'
import { authUserAtom, signOut } from 'entities/auth'
import { type APITypes, usersApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { useSilentRefetchOnFocus } from 'shared/lib/hooks/useSilentRefetchOnFocus'
import { useCacheFirstEntity } from 'shared/lib/session-cache'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { userDetailCache } from './userDetailCache'

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
const SELF_PASSWORD_CHANGED_MESSAGE = 'Пароль изменён, войдите заново'
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить пользователя'

/**
 * Деталь пользователя: загрузка, удаление и смена пароля. Удаление собственного
 * аккаунта скрыто в UI (`isOwnAccount`) — дублирует серверную защиту self-delete.
 * @param id — идентификатор пользователя.
 */
export const useAdminUserDetail = (id: string): AdminUserDetailState => {
  const showToastAction = useAction(showToast)
  const signOutAction = useAction(signOut)
  const [currentUser] = useAtom(authUserAtom)
  const [user, setUser] = useState<APITypes.UserResponse | null>(null)
  const [isNotFound, setIsNotFound] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const isOwnAccount = currentUser?.id === id

  const fetchUser = useCallback(
    () => userDetailCache.fetchThrough(id, () => usersApi.getUsers().usersControllerFindOne(id)),
    [id],
  )

  useCacheFirstEntity({
    cache: userDetailCache,
    errorMessage: LOAD_ERROR_MESSAGE,
    fetcher: fetchUser,
    id,
    onLoaded: setUser,
    onNotFound: () => setIsNotFound(true),
  })

  useSilentRefetchOnFocus(
    useCallback(async () => {
      if (!id) return

      try {
        setUser(await fetchUser())
      } catch (error) {
        reportError(error, LOAD_ERROR_MESSAGE)
      }
    }, [fetchUser, id]),
  )

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

        if (isOwnAccount) {
          // The backend bumped tokenVersion: every session of this user is dead,
          // including the current one. signOut owns local cleanup; the admin
          // layout redirects to /admin/login once authUserAtom is null.
          await signOutAction()
          showToastAction(SELF_PASSWORD_CHANGED_MESSAGE)
        } else showToastAction(PASSWORD_CHANGED_MESSAGE)

        return true
      } catch (error) {
        showToastAction(getErrorMessage(error))
        return false
      } finally {
        setIsChangingPassword(false)
      }
    },
    [id, isOwnAccount, showToastAction, signOutAction],
  )

  return {
    changePassword,
    isChangingPassword,
    isDeleting,
    isNotFound,
    isOwnAccount,
    remove,
    user,
  }
}
