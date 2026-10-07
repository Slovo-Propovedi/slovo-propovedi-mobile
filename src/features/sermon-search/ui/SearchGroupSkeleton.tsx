import { View } from 'react-native'
import { TracksListItem } from 'entities/track-list'
import { SearchGroupHeader } from './SearchGroupHeader'

const DEFAULT_ROW_COUNT = 4

export const SearchGroupSkeleton = ({ rowCount = DEFAULT_ROW_COUNT }: { rowCount?: number }) => (
  <View>
    <SearchGroupHeader.Skeleton />
    {Array.from({ length: rowCount }, (_, index) => (
      <TracksListItem.Skeleton key={index} />
    ))}
  </View>
)
