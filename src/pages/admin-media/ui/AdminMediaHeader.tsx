import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const UPLOAD_LABEL = 'Загрузить файл'

// Шапка экрана «Медиа»: заголовок слева и иконка загрузки файла справа.
export const AdminMediaHeader = ({
  isUploading,
  onUpload,
}: {
  isUploading: boolean
  onUpload: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: currentTheme.text }]}>Медиа</Text>
          <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
            Библиотека изображений: загрузка и удаление. Обложки переиспользуются в проповедях и
            плейлистах.
          </Text>
        </View>
        <IconButton
          onPress={onUpload}
          disabled={isUploading}
          accessibilityLabel={UPLOAD_LABEL}
          Icon={
            <Ionicons
              size={24}
              name='cloud-upload-outline'
              color={isUploading ? currentTheme.textMuted : currentTheme.primary}
            />
          }
        />
      </View>
    </View>
  )
}
