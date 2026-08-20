import { memo } from 'react'
import { TracksListItem } from 'shared/ui/track-list'
import type { TracksListItemProps } from 'shared/ui/track-list/types'

interface PlaylistSheetRowProps extends Omit<TracksListItemProps, 'onPress' | 'progress'> {
  index: number
  onPress: (index: number) => void
  storedProgress?: number
}

export const PlaylistSheetRow = memo(
  ({ index, onPress, storedProgress, ...trackItemProps }: PlaylistSheetRowProps) => (
    <TracksListItem {...trackItemProps} progress={storedProgress} onPress={() => onPress(index)} />
  ),
)
