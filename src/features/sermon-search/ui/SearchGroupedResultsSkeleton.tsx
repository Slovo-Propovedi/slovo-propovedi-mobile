import { View } from 'react-native'
import { SearchGroupSkeleton } from './SearchGroupSkeleton'

const SKELETON_GROUP_ROW_COUNT = 4

export const SearchGroupedResultsSkeleton = () => (
  <View>
    <SearchGroupSkeleton rowKind='track' rowCount={SKELETON_GROUP_ROW_COUNT} />
    <SearchGroupSkeleton rowKind='list' rowCount={SKELETON_GROUP_ROW_COUNT} />
    <SearchGroupSkeleton rowKind='list' rowCount={SKELETON_GROUP_ROW_COUNT} />
  </View>
)
