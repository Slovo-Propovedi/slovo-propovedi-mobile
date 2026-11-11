import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { AdminMediaHeader } from './AdminMediaHeader'
import { OrphansSection } from './OrphansSection'
import { styles } from './styles'

// Шапка списка медиа-библиотеки: заголовок, полоса прогресса и блок осиротевших
// файлов. Подсказку drag & drop показывает полноэкранный оверлей (`DropOverlay`),
// поэтому отдельной строки здесь нет.
export const AdminMediaListHeader = ({
  isUploading,
  progress,
}: {
  isUploading: boolean
  progress: number
}) => {
  const { currentTheme } = useTheme()

  return (
    <View>
      <AdminMediaHeader />
      {isUploading ? (
        <View style={[styles.progressTrack, { backgroundColor: currentTheme.surface }]}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      ) : null}
      <OrphansSection />
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Обложки</Text>
    </View>
  )
}
