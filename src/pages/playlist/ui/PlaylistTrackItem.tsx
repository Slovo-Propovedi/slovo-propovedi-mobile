import { memo } from 'react'
import { useIsDownloadingUrl } from 'entities/player'
import { INDENTS } from 'shared/ui/theme'
import { type MenuAction, TracksListItem } from 'shared/ui/track-list'

interface PlaylistTrackItemProps {
  artwork: null | string
  audioUrl?: null | string
  cacheTrigger?: number
  currentAudioId?: string
  id: string | undefined
  index: number
  isPlaying: boolean
  menuActions?: MenuAction[]
  onPress: (index: number) => void
  storedProgress?: number
  subtitle?: string
  title: string
}

export const PlaylistTrackItem = memo(
  ({
    artwork,
    audioUrl,
    cacheTrigger,
    currentAudioId,
    id,
    index,
    isPlaying,
    menuActions,
    onPress,
    storedProgress,
    subtitle,
    title,
  }: PlaylistTrackItemProps) => {
    const isDownloading = useIsDownloadingUrl(audioUrl ?? null)

    return (
      <TracksListItem
        title={title}
        artwork={artwork}
        subtitle={subtitle}
        progress={storedProgress}
        menuActions={menuActions}
        cacheTrigger={cacheTrigger}
        isDownloading={isDownloading}
        onPress={() => onPress(index)}
        audioUrl={audioUrl ?? undefined}
        isPlaying={currentAudioId === id}
        style={{ marginHorizontal: INDENTS.medium }}
        isAudioPlaying={currentAudioId === id && isPlaying}
      />
    )
  },
)
