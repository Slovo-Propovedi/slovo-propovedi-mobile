import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { AdminMediaHeader } from './AdminMediaHeader'
import { OrphansSection } from './OrphansSection'
import { styles } from './styles'

const DROP_HINT = 'Отпустите изображение, чтобы загрузить'

// Шапка списка медиа-библиотеки: заголовок с загрузкой, полоса прогресса,
// подсказка drag & drop и блок осиротевших файлов.
export const AdminMediaListHeader = ({
  isDragActive,
  isUploading,
  onUpload,
  progress,
}: {
  isDragActive?: boolean
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
      {isDragActive ? (
        <Text style={[styles.dropHint, { color: currentTheme.textMuted }]}>{DROP_HINT}</Text>
      ) : null}
      <OrphansSection />
    </View>
  )
}
