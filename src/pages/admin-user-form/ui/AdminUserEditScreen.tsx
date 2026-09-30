import { type Href, Stack, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAdminFormHeader } from 'widgets/admin-form-header'
import { type APITypes } from 'shared/api'
import { EmptyState } from 'shared/ui'
import { COLORS, useTheme } from 'shared/ui/theme'
import { useAdminUserEntity } from '../lib/useAdminUserEntity'
import { useUserFormController } from '../lib/useUserFormController'
import { styles } from './styles'
import { UserForm } from './UserForm'

const USERS_FALLBACK_ROUTE: Href = '/admin/users'

// Экран редактирования пользователя: грузит сущность и монтирует форму только
// после успешной загрузки, чтобы пропсы initial оставались стабильными.
export const AdminUserEditScreen = () => {
  const { currentTheme } = useTheme()
  const params = useLocalSearchParams<{ id: string }>()
  const id = params.id ?? ''
  const { isLoading, isNotFound, user } = useAdminUserEntity(id)

  if (user)
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <UserEditForm id={id} initial={user} />
      </View>
    )

  return (
    <View style={[styles.centered, { backgroundColor: currentTheme.background }]}>
      {isLoading && !isNotFound ? (
        <ActivityIndicator size='large' color={COLORS.primary} />
      ) : (
        <EmptyState message='Пользователь не найден' />
      )}
    </View>
  )
}

// Отдельный компонент: хук формы монтируется только когда сущность загружена.
const UserEditForm = ({ id, initial }: { id: string; initial: APITypes.UserResponse }) => {
  const { error, isSubmitting, onChange, save, values } = useUserFormController({
    id,
    initial,
    mode: 'edit',
  })
  const headerOptions = useAdminFormHeader({
    fallbackRoute: USERS_FALLBACK_ROUTE,
    isSubmitting,
    onSave: save,
    title: 'Редактировать пользователя',
  })

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <UserForm mode='edit' error={error} values={values} onChange={onChange} />
    </>
  )
}
