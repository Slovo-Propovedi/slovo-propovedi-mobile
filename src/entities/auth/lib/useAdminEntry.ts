import { useAction, useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { authStatusAtom, authUserAtom, canAccessAdmin } from '../model'
import { restoreSession } from './restoreSession'

/**
 * Вход в интерфейс администратора из публичной части приложения.
 * Если сессия ещё не восстанавливалась (`idle`) — восстанавливает её,
 * затем отправляет на /admin при наличии прав либо на /admin/login.
 */
export const useAdminEntry = () => {
  const router = useRouter()
  const restore = useAction(restoreSession)
  const [status] = useAtom(authStatusAtom)
  const [user] = useAtom(authUserAtom)

  const openAdminInterface = async () => {
    if (status === 'idle') {
      const restoredUser = await restore()
      router.push(canAccessAdmin(restoredUser) ? '/admin' : '/admin/login')

      return
    }

    router.push(canAccessAdmin(user) ? '/admin' : '/admin/login')
  }

  return { openAdminInterface }
}
