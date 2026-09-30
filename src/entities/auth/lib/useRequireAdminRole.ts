import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { authUserAtom, isAdminUser } from '../model'

/** Пользователи без роли admin не должны видеть раздел управления пользователями. */
export const useRequireAdminRole = () => {
  const router = useRouter()
  const [user] = useAtom(authUserAtom)

  useEffect(() => {
    if (user && !isAdminUser(user)) router.replace('/admin')
  }, [user, router])
}
