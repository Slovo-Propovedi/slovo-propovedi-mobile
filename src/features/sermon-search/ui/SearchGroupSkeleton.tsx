import { View } from 'react-native'
import { TracksListItem } from 'entities/track-list'
import { SearchGroupHeader } from './SearchGroupHeader'
import { SearchRowSkeleton } from './SearchRowSkeleton'

const DEFAULT_ROW_COUNT = 4

export const SearchGroupSkeleton = ({
  rowCount = DEFAULT_ROW_COUNT,
  rowKind,
}: {
  rowCount?: number
  rowKind: 'list' | 'track'
}) => (
  <View>
    <SearchGroupHeader.Skeleton />
    {Array.from({ length: rowCount }, (_, index) =>
      rowKind === 'track' ? (
        <TracksListItem.Skeleton key={index} />
      ) : (
        <SearchRowSkeleton key={index} />
      ),
    )}
  </View>
)
