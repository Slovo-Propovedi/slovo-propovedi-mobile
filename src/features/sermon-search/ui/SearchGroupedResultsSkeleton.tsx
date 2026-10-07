import { View } from 'react-native'
import { SearchGroupSkeleton } from './SearchGroupSkeleton'

const SKELETON_GROUP_ROW_COUNT = 4

export const SearchGroupedResultsSkeleton = () => (
  <View>
    <SearchGroupSkeleton rowCount={SKELETON_GROUP_ROW_COUNT} />
    <SearchGroupSkeleton rowCount={SKELETON_GROUP_ROW_COUNT} />
    <SearchGroupSkeleton rowCount={SKELETON_GROUP_ROW_COUNT} />
  </View>
)
