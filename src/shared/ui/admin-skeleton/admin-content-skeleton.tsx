import { View } from 'react-native'
import { SkeletonBar } from './admin-skeleton-row'
import { styles } from './styles'

const DEFAULT_CARD_COUNT = 3

const SkeletonCard = () => (
  <View style={styles.contentCard}>
    <SkeletonBar style={styles.contentCardTitle} />
    <SkeletonBar style={styles.contentCardLine} />
    <SkeletonBar style={styles.contentCardLine} />
    <SkeletonBar style={styles.contentCardLineShort} />
  </View>
)

// Общий плейсхолдер контента детальных/формовых экранов админки: стопка
// карточек-заготовок вместо полноэкранного спиннера.
export const AdminContentSkeleton = ({
  cardCount = DEFAULT_CARD_COUNT,
}: {
  cardCount?: number
}) => (
  <>
    {Array.from({ length: cardCount }, (_, index) => (
      <SkeletonCard key={index} />
    ))}
  </>
)
