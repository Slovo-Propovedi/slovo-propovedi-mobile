import { View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { AdminMediaHeader } from './AdminMediaHeader'
import { OrphansSection } from './OrphansSection'
import { styles } from './styles'

// Шапка списка медиа-библиотеки: заголовок с загрузкой, полоса прогресса и
// блок осиротевших файлов.
export const AdminMediaListHeader = ({
  isUploading,
  onUpload,
  progress,
}: {
  isUploading: boolean
  onUpload: () => void
  progress: number
}) => {
  const { currentTheme } = useTheme()

  return (
    <View>
      <AdminMediaHeader onUpload={onUpload} isUploading={isUploading} />
      {isUploading ? (
        <View style={[styles.progressTrack, { backgroundColor: currentTheme.surface }]}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      ) : null}
      <OrphansSection />
    </View>
  )
}
