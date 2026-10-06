import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { PressableButton } from 'shared/ui/pressable-button/PressableButton'
import { COLORS, useTheme } from 'shared/ui/theme'
import { formatFileSize, getMediaFileKind, getMediaKindLabel } from '../lib/fileKind'
import { styles } from './styles'

const MANUAL_NOTE = 'удаляется вручную из каталога'

// Строка осиротевшего файла: бейдж типа (аудио/текст/изображение), имя, размер
// и действие. Изображения очистка не трогает — у них пометка «вручную», а
// аудио/текст удаляются поштучно через `DELETE /files/:fileName`.
export const OrphanRow = ({
  file,
  onDelete,
}: {
  file: APITypes.FileMetadataDto
  onDelete: () => void
}) => {
  const { currentTheme } = useTheme()
  const kind = getMediaFileKind(file.fileName)
  const isImage = kind === 'image'

  return (
    <View style={[styles.orphanRow, { backgroundColor: currentTheme.surface }]}>
      <View
        style={[
          styles.orphanBadge,
          { backgroundColor: kind === 'audio' ? currentTheme.primary : COLORS.disabled },
        ]}
      >
        <Text style={[styles.orphanBadgeText, { color: currentTheme.text }]}>
          {getMediaKindLabel(kind)}
        </Text>
      </View>
      <View style={styles.orphanInfo}>
        <Text numberOfLines={1} style={[styles.orphanName, { color: currentTheme.text }]}>
          {file.fileName}
        </Text>
        <Text style={[styles.orphanMeta, { color: currentTheme.textMuted }]}>
          {formatFileSize(file.size)}
        </Text>
      </View>
      {isImage ? (
        <Text style={[styles.orphanNote, { color: currentTheme.textMuted }]}>{MANUAL_NOTE}</Text>
      ) : (
        <PressableButton
          onPress={onDelete}
          style={styles.orphanDelete}
          accessibilityLabel={`Удалить ${file.fileName}`}
        >
          <Ionicons size={16} name='trash' color={COLORS.white} />
        </PressableButton>
      )}
    </View>
  )
}
