import { Stack } from 'expo-router'
import { View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { usePlaylistFormController } from '../lib/usePlaylistFormController'
import { usePlaylistFormHeader } from '../lib/usePlaylistFormHeader'
import { PlaylistForm } from './PlaylistForm'
import { styles } from './styles'

// Экран создания плейлиста: форма в режиме create + «Сохранить» в шапке.
export const AdminPlaylistCreateScreen = () => {
  const { currentTheme } = useTheme()
  const { error, isSubmitting, onChange, save, values } = usePlaylistFormController({
    mode: 'create',
  })
  const headerOptions = usePlaylistFormHeader(isSubmitting, save)

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={headerOptions} />
      <PlaylistForm error={error} values={values} onChange={onChange} />
    </View>
  )
}
