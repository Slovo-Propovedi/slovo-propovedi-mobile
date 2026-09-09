import { memo } from 'react'
import { INDENTS } from 'shared/ui/theme'
import { type MenuAction, TracksListItem } from 'shared/ui/track-list'

interface PlaylistTrackItemProps {
  artwork: null | string
  audioUrl?: null | string
  cacheTrigger?: number
  currentAudioId?: string
  downloadingUrl?: null | string
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
    downloadingUrl,
    id,
    index,
    isPlaying,
    menuActions,
    onPress,
    storedProgress,
    subtitle,
    title,
  }: PlaylistTrackItemProps) => (
    <TracksListItem
      title={title}
      artwork={artwork}
      subtitle={subtitle}
      progress={storedProgress}
      menuActions={menuActions}
      cacheTrigger={cacheTrigger}
      onPress={() => onPress(index)}
      downloadingUrl={downloadingUrl}
      audioUrl={audioUrl ?? undefined}
      isPlaying={currentAudioId === id}
      style={{ marginHorizontal: INDENTS.medium }}
      isAudioPlaying={currentAudioId === id && isPlaying}
    />
  ),
)
