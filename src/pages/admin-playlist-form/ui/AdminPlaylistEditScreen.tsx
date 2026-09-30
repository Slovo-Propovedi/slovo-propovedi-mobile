import { Stack, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { EmptyState } from 'shared/ui'
import { COLORS, useTheme } from 'shared/ui/theme'
import { useAdminPlaylistEntity } from '../lib/useAdminPlaylistEntity'
import { usePlaylistFormController } from '../lib/usePlaylistFormController'
import { usePlaylistFormHeader } from '../lib/usePlaylistFormHeader'
import { PlaylistForm } from './PlaylistForm'
import { styles } from './styles'

// Экран редактирования плейлиста: грузит сущность и монтирует форму только
// после успешной загрузки, чтобы пропсы initial оставались стабильными.
export const AdminPlaylistEditScreen = () => {
  const { currentTheme } = useTheme()
  const params = useLocalSearchParams<{ id: string }>()
  const id = params.id ?? ''
  const { isLoading, isNotFound, playlist } = useAdminPlaylistEntity(id)

  if (playlist)
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <PlaylistEditForm id={id} initial={playlist} />
      </View>
    )

  return (
    <View style={[styles.centered, { backgroundColor: currentTheme.background }]}>
      {isLoading && !isNotFound ? (
        <ActivityIndicator size='large' color={COLORS.primary} />
      ) : (
        <EmptyState message='Плейлист не найден' />
      )}
    </View>
  )
}

// Отдельный компонент: хук формы монтируется только когда сущность загружена.
const PlaylistEditForm = ({ id, initial }: { id: string; initial: APITypes.PlaylistEntity }) => {
  const { error, isSubmitting, onChange, save, values } = usePlaylistFormController({
    id,
    initial,
    mode: 'edit',
  })
  const headerOptions = usePlaylistFormHeader(isSubmitting, save)

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <PlaylistForm error={error} values={values} onChange={onChange} />
    </>
  )
}
