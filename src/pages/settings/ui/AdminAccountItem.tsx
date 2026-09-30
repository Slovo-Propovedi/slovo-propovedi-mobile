import { useAction, useAtom } from '@reatom/npm-react'
import { authStatusAtom, authUserAtom, signOut, useAdminEntry } from 'entities/auth'
import { SettingsItem } from './SettingsItem'

const ADMIN_ENTRY_TITLE = 'Перейти в интерфейс администратора'
const ADMIN_SIGN_OUT_TITLE = 'Выйти из аккаунта админа'

// Пункт «Настроек»: вход в админку для неаутентифицированных,
// выход из аккаунта администратора для аутентифицированных.
export const AdminAccountItem = () => {
  const { openAdminInterface } = useAdminEntry()
  const signOutAction = useAction(signOut)
  const [status] = useAtom(authStatusAtom)
  const [user] = useAtom(authUserAtom)

  const isAuthenticated = status === 'authenticated' && user !== null

  if (isAuthenticated)
    return (
      <SettingsItem
        icon='log-out-outline'
        title={ADMIN_SIGN_OUT_TITLE}
        onPress={() => {
          void signOutAction()
        }}
      />
    )

  return (
    <SettingsItem
      icon='shield-outline'
      title={ADMIN_ENTRY_TITLE}
      onPress={() => {
        void openAdminInterface()
      }}
    />
  )
}
