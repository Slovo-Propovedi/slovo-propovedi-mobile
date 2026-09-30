import { Stack } from 'expo-router'
import { View } from 'react-native'
import { useRequireAdminRole } from 'entities/auth'
import { useTheme } from 'shared/ui/theme'
import { useUserFormController } from '../lib/useUserFormController'
import { useUserFormHeader } from '../lib/useUserFormHeader'
import { styles } from './styles'
import { UserForm } from './UserForm'

// Экран создания пользователя: форма в режиме create + «Сохранить» в шапке.
export const AdminUserCreateScreen = () => {
  useRequireAdminRole()
  const { currentTheme } = useTheme()
  const { error, isSubmitting, onChange, save, values } = useUserFormController({ mode: 'create' })
  const headerOptions = useUserFormHeader(isSubmitting, save)

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={headerOptions} />
      <UserForm error={error} mode='create' values={values} onChange={onChange} />
    </View>
  )
}
