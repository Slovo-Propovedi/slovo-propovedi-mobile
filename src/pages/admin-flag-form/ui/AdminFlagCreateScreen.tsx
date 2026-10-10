import { type Href, Stack } from 'expo-router'
import { View } from 'react-native'
import { useAdminFormHeader } from 'widgets/admin-form-header'
import { useRequireAdminRole } from 'entities/auth'
import { useTheme } from 'shared/ui/theme'
import { useFlagFormController } from '../lib/useFlagFormController'
import { FlagForm } from './FlagForm'
import { styles } from './styles'

const FLAGS_FALLBACK_ROUTE: Href = '/admin/flags'

// Экран создания фича-флага: форма в режиме create + «Сохранить» в шапке.
export const AdminFlagCreateScreen = () => {
  useRequireAdminRole()
  const { currentTheme } = useTheme()
  const { error, isDirty, isSubmitting, markTouched, onChange, save, touched, values } =
    useFlagFormController({
      mode: 'create',
    })
  const headerOptions = useAdminFormHeader({
    fallbackRoute: FLAGS_FALLBACK_ROUTE,
    isDirty,
    isSubmitting,
    onSave: save,
    title: 'Создать флаг',
  })

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={headerOptions} />
      <FlagForm
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
