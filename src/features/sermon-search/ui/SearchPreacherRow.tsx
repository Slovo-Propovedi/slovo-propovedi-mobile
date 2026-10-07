import { memo } from 'react'
import { SearchListItem } from './SearchListItem'

export const SearchPreacherRow = memo(
  ({ artist, onPress }: { artist: string; onPress: (artist: string) => void }) => (
    <SearchListItem title={artist} onPress={() => onPress(artist)} />
  ),
)
