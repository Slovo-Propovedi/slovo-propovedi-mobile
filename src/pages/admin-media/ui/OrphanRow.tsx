import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { COLORS, useTheme } from 'shared/ui/theme'
import { formatFileSize, getMediaFileKind, getMediaKindLabel } from '../lib/fileKind'
import { styles } from './styles'

const MANUAL_NOTE = 'удаляется вручную из каталога'

// Строка осиротевшего файла: бейдж типа (аудио/текст/изображение), имя, размер
// и пометка для изображений (их очистка не трогает).
export const OrphanRow = ({ file }: { file: APITypes.FileMetadataDto }) => {
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
      ) : null}
    </View>
  )
}
