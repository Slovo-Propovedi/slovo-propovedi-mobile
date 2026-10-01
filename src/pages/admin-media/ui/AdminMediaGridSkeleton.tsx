import { View } from 'react-native'
import { MediaTile } from './MediaTile'
import { styles } from './styles'

const DEFAULT_TILE_ROW_COUNT = 4

// Плейсхолдер медиа-сетки: ряды плиток той же геометрии, что и настоящие
// `MediaTile` (единый источник — `MediaTile.Skeleton`). Перенос строк делает
// flex-wrap, поэтому сетка совпадает с реальной при том же числе колонок.
export const AdminMediaGridSkeleton = ({
  numColumns,
  rowCount = DEFAULT_TILE_ROW_COUNT,
  tileSize,
}: {
  numColumns: number
  rowCount?: number
  tileSize: number
}) => (
  <View style={styles.mediaGrid}>
    {Array.from({ length: numColumns * rowCount }, (_, index) => (
      <MediaTile.Skeleton key={index} size={tileSize} />
    ))}
  </View>
)
