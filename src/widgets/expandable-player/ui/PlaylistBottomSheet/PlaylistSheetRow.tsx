import { memo } from 'react'
import { useSermonProgress } from 'entities/listening-history'
import { TracksListItem } from 'shared/ui/track-list'
import type { TracksListItemProps } from 'shared/ui/track-list/types'

interface PlaylistSheetRowProps extends Omit<TracksListItemProps, 'onPress' | 'progress'> {
  id: string
  index: number
  onPress: (index: number) => void
  storedProgress?: number
}

export const PlaylistSheetRow = memo(
  ({ id, index, onPress, storedProgress, ...trackItemProps }: PlaylistSheetRowProps) => {
    const progress = useSermonProgress(id, storedProgress)

    return <TracksListItem {...trackItemProps} progress={progress} onPress={() => onPress(index)} />
  },
)
