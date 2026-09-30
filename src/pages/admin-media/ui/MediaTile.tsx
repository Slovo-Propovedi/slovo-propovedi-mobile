import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { CoverImage } from 'shared/ui'
import { PressableButton } from 'shared/ui/pressable-button/PressableButton'
import { COLORS, useTheme } from 'shared/ui/theme'
import { formatFileSize } from '../lib/fileKind'
import { styles } from './styles'

const USED_BADGE = 'используется'

// Карточка изображения в каталоге медиа: обложка, бейдж «используется»,
// кнопка удаления и подпись с именем и размером. Удаление — компактный
// оверлей на самой картинке (выделенный touch-target обязателен только
// для навигационных icon-кнопок, здесь же кнопка часть карточки).
export const MediaTile = ({
  file,
  onDelete,
}: {
  file: APITypes.FileMetadataDto
  onDelete: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={[styles.tile, { backgroundColor: currentTheme.surface }]}>
      <CoverImage uri={file.fileUrl} style={styles.gridImage} imageStyle={styles.gridImage} />
      {file.used ? (
        <View style={styles.tileBadge}>
          <Text style={styles.tileBadgeText}>{USED_BADGE}</Text>
        </View>
      ) : null}
      <PressableButton
        onPress={onDelete}
        style={styles.tileDelete}
        accessibilityLabel={`Удалить ${file.fileName}`}
      >
        <Ionicons size={16} name='trash' color={COLORS.white} />
      </PressableButton>
      <View style={styles.tileBody}>
        <Text numberOfLines={2} style={[styles.tileName, { color: currentTheme.text }]}>
          {file.fileName}
        </Text>
        <Text style={[styles.tileMeta, { color: currentTheme.textMuted }]}>
          {formatFileSize(file.size)}
        </Text>
      </View>
    </View>
  )
}
