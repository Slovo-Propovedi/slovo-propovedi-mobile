import { View } from 'react-native'
import { TracksListItem } from 'entities/track-list'

const SKELETON_ROWS = 6

export const PreacherSermonsSkeleton = () => (
  <View>
    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <TracksListItem.Skeleton key={index} />
    ))}
  </View>
)
