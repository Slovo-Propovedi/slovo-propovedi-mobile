import { type Href, Stack } from 'expo-router'
import { View } from 'react-native'
import { useAdminFormHeader } from 'widgets/admin-form-header'
import { useRequireAdminRole } from 'entities/auth'
import { useTheme } from 'shared/ui/theme'
import { useUserFormController } from '../lib/useUserFormController'
import { styles } from './styles'
import { UserForm } from './UserForm'

const USERS_FALLBACK_ROUTE: Href = '/admin/users'

// Экран создания пользователя: форма в режиме create + «Сохранить» в шапке.
export const AdminUserCreateScreen = () => {
  useRequireAdminRole()
  const { currentTheme } = useTheme()
  const { error, isDirty, isSubmitting, markTouched, onChange, save, touched, values } =
    useUserFormController({
      mode: 'create',
    })
  const headerOptions = useAdminFormHeader({
    fallbackRoute: USERS_FALLBACK_ROUTE,
    isDirty,
    isSubmitting,
    onSave: save,
    title: 'Создать пользователя',
  })

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={headerOptions} />
      <UserForm
        error={error}
        mode='create'
        values={values}
        touched={touched}
        onChange={onChange}
        markTouched={markTouched}
      />
    </View>
  )
}
