import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { type APITypes } from 'shared/api'
import { CoverImage } from 'shared/ui'
import { SkeletonBar } from 'shared/ui/admin-skeleton'
import { PressableButton } from 'shared/ui/pressable-button/PressableButton'
import { useSkeletonPulse } from 'shared/ui/skeleton/useSkeletonPulse'
import { COLORS, useTheme } from 'shared/ui/theme'
import { formatFileSize } from '../lib/fileKind'
import { styles } from './styles'

const USED_BADGE = 'используется'

// Квадратная плитка изображения в каталоге медиа: обложка, бейдж «используется»,
// кнопка удаления и подпись с именем и размером. Тап по плитке открывает
// полноэкранный просмотр; удаление — компактный оверлей на самой картинке.
export const MediaTile = ({
  file,
  onDelete,
  onPress,
  size,
}: {
  file: APITypes.FileMetadataDto
  onDelete: () => void
  onPress: () => void
  size: number
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={[styles.tile, { backgroundColor: currentTheme.surface, width: size }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole='button'
        accessibilityLabel={`Открыть ${file.fileName}`}
      >
        <CoverImage
          uri={file.fileUrl}
          imageStyle={styles.gridImage}
          style={[styles.tileImage, { height: size }]}
        />
      </Pressable>
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
        <Text numberOfLines={1} style={[styles.tileName, { color: currentTheme.text }]}>
          {file.fileName}
        </Text>
        <Text style={[styles.tileMeta, { color: currentTheme.textMuted }]}>
          {formatFileSize(file.size)}
        </Text>
      </View>
    </View>
  )
}

// Плейсхолдер плитки: та же геометрия, что у компонента (`styles.tile`,
// `styles.tileImage`, `styles.tileBody`) — квадрат-обложка высотой `size` и две
// строки подписи. Размер меняется только вместе с настоящей плиткой.
const MediaTileSkeleton = ({ size }: { size: number }) => {
  const { currentTheme } = useTheme()
  const { pulseStyle } = useSkeletonPulse()

  return (
    <Animated.View
      testID='admin-media-tile-skeleton'
      style={[
        styles.tile,
        { backgroundColor: currentTheme.surface, width: size },
        pulseStyle,
        { pointerEvents: 'none' },
      ]}
    >
      <SkeletonBar style={[styles.tileImage, { height: size }]} />
      <View style={styles.tileBody}>
        <SkeletonBar style={styles.tileNameBar} />
        <SkeletonBar style={styles.tileMetaBar} />
      </View>
    </Animated.View>
  )
}

// Скелетон живёт в одном файле с компонентом и прикреплён к нему как
// `MediaTile.Skeleton`: геометрия не может «отъехать» от реальной плитки.
MediaTile.Skeleton = MediaTileSkeleton
