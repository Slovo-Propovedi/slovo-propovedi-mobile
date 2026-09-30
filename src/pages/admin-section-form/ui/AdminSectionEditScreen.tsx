import { useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { EmptyState } from 'shared/ui'
import { COLORS, useTheme } from 'shared/ui/theme'
import { useAdminSectionEntity } from '../lib/useAdminSectionEntity'
import { SectionForm } from './SectionForm'
import { styles } from './styles'

// Экран редактирования раздела: грузит сущность и монтирует форму только после
// успешной загрузки, чтобы пропсы initial оставались стабильными.
export const AdminSectionEditScreen = () => {
  const { currentTheme } = useTheme()
  const params = useLocalSearchParams<{ id: string }>()
  const id = params.id ?? ''
  const { isLoading, isNotFound, section } = useAdminSectionEntity(id)

  if (section)
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <SectionForm id={id} mode='edit' initial={section} />
      </View>
    )

  return (
    <View style={[styles.centered, { backgroundColor: currentTheme.background }]}>
      {isLoading && !isNotFound ? (
        <ActivityIndicator size='large' color={COLORS.primary} />
      ) : (
        <EmptyState message='Раздел не найден' />
      )}
    </View>
  )
}
