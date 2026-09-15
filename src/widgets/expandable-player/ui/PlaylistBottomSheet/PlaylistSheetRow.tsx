import { memo } from 'react'
import { useIsDownloadingUrl } from 'entities/player'
import { TracksListItem } from 'shared/ui/track-list'
import type { TracksListItemProps } from 'shared/ui/track-list/types'

interface PlaylistSheetRowProps extends Omit<
  TracksListItemProps,
  'isDownloading' | 'onPress' | 'progress'
> {
  index: number
  onPress: (index: number) => void
  storedProgress?: number
}

export const PlaylistSheetRow = memo(
  ({ audioUrl, index, onPress, storedProgress, ...trackItemProps }: PlaylistSheetRowProps) => {
    const isDownloading = useIsDownloadingUrl(audioUrl ?? null)

    return (
      <TracksListItem
        {...trackItemProps}
        audioUrl={audioUrl}
        progress={storedProgress}
        isDownloading={isDownloading}
        onPress={() => onPress(index)}
      />
    )
  },
)
