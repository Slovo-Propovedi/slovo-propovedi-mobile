import { type Href, Stack } from 'expo-router'
import { View } from 'react-native'
import { useAdminFormHeader } from 'widgets/admin-form-header'
import { useTheme } from 'shared/ui/theme'
import { usePlaylistFormController } from '../lib/usePlaylistFormController'
import { PlaylistForm } from './PlaylistForm'
import { styles } from './styles'

const PLAYLISTS_FALLBACK_ROUTE: Href = '/admin/playlists'

// Экран создания плейлиста: форма в режиме create + «Сохранить» в шапке.
export const AdminPlaylistCreateScreen = () => {
  const { currentTheme } = useTheme()
  const { error, isDirty, isSubmitting, markTouched, onChange, save, touched, values } =
    usePlaylistFormController({
      mode: 'create',
    })
  const headerOptions = useAdminFormHeader({
    fallbackRoute: PLAYLISTS_FALLBACK_ROUTE,
    isDirty,
    isSubmitting,
    onSave: save,
    title: 'Создать плейлист',
  })

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={headerOptions} />
      <PlaylistForm
        error={error}
        values={values}
        touched={touched}
        onChange={onChange}
        selectedSermons={[]}
        markTouched={markTouched}
      />
    </View>
  )
}
