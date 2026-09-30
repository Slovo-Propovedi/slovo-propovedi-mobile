import { type Href, Stack } from 'expo-router'
import { View } from 'react-native'
import { useAdminFormHeader } from 'widgets/admin-form-header'
import { useTheme } from 'shared/ui/theme'
import { useSermonFormController } from '../lib/useSermonFormController'
import { SermonForm } from './SermonForm'
import { styles } from './styles'

const SERMONS_FALLBACK_ROUTE: Href = '/admin/sermons'

// Экран создания проповеди: форма в режиме create + «Сохранить» в шапке.
export const AdminSermonCreateScreen = () => {
  const { currentTheme } = useTheme()
  const {
    error,
    isDirty,
    isSubmitting,
    markTouched,
    onChange,
    onChapterEndChange,
    save,
    touched,
    values,
  } = useSermonFormController({ mode: 'create' })
  const headerOptions = useAdminFormHeader({
    fallbackRoute: SERMONS_FALLBACK_ROUTE,
    isDirty,
    isSubmitting,
    onSave: save,
    title: 'Загрузить проповедь',
  })

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={headerOptions} />
      <SermonForm
        error={error}
        values={values}
        touched={touched}
        onChange={onChange}
        markTouched={markTouched}
        onChapterEndChange={onChapterEndChange}
      />
    </View>
  )
}
