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
  const { error, isDirty, isSubmitting, onChange, onChapterEndChange, save, values } =
    useSermonFormController({ mode: 'create' })
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
        onChange={onChange}
        onChapterEndChange={onChapterEndChange}
      />
    </View>
  )
}
