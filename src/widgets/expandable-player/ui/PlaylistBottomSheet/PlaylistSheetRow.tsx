import { memo, useCallback } from 'react'
import { useHistoryProgress } from 'entities/listening-history'
import { TracksListItem } from 'shared/ui/track-list'
import type { TracksListItemProps } from 'shared/ui/track-list/types'

interface PlaylistSheetRowProps extends Omit<TracksListItemProps, 'onPress' | 'progress'> {
  id: string
  index: number
  onPress: (index: number) => void
}

export const PlaylistSheetRow = memo(
  ({ audioUrl, id, index, onPress, ...trackItemProps }: PlaylistSheetRowProps) => {
    const storedProgress = useHistoryProgress(id)
    const handlePress = useCallback(() => onPress(index), [index, onPress])

    return (
      <TracksListItem
        {...trackItemProps}
        audioUrl={audioUrl}
        onPress={handlePress}
        progress={storedProgress}
      />
    )
  },
)
