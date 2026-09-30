import { View } from 'react-native'
import { SkeletonBar } from './admin-skeleton-row'
import { styles } from './styles'

const DEFAULT_TILE_ROW_COUNT = 4

// Плейсхолдер медиа-сетки: три квадратные плитки-обложки в ряд.
export const AdminMediaGridSkeleton = ({
  rowCount = DEFAULT_TILE_ROW_COUNT,
}: {
  rowCount?: number
}) => (
  <>
    {Array.from({ length: rowCount }, (_, index) => (
      <View key={index} style={styles.gridRow}>
        <SkeletonBar style={styles.tile} />
        <SkeletonBar style={styles.tile} />
        <SkeletonBar style={styles.tile} />
      </View>
    ))}
  </>
)
