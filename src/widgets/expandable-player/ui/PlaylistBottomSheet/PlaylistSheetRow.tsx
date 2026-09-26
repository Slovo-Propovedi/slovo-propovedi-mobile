import { memo, useCallback } from 'react'
import { useHistoryProgress } from 'entities/listening-history'
import { useTrackItemCache } from 'entities/offline-cache'
import { TracksListItem, type TracksListItemProps } from 'entities/track-list'

interface PlaylistSheetRowProps extends Omit<
  TracksListItemProps,
  'cacheState' | 'onPress' | 'progress'
> {
  cacheTrigger?: number
  id: string
  index: number
  onPress: (index: number) => void
}

export const PlaylistSheetRow = memo(
  ({ audioUrl, cacheTrigger, id, index, onPress, ...trackItemProps }: PlaylistSheetRowProps) => {
    const storedProgress = useHistoryProgress(id)
    const cacheState = useTrackItemCache(audioUrl, cacheTrigger)
    const handlePress = useCallback(() => onPress(index), [index, onPress])

    return (
      <TracksListItem
        {...trackItemProps}
        audioUrl={audioUrl}
        onPress={handlePress}
        cacheState={cacheState}
        progress={storedProgress}
      />
    )
  },
)
