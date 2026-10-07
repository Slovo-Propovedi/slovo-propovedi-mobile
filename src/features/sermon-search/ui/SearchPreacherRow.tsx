import { memo } from 'react'
import { ListItemBase } from 'entities/list-item'

export const SearchPreacherRow = memo(
  ({ artist, onPress }: { artist: string; onPress: (artist: string) => void }) => (
    <ListItemBase title={artist} onPress={() => onPress(artist)} />
  ),
)
