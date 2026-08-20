import { memo } from 'react'
import { INDENTS } from 'shared/ui/theme'
import { TracksListItem } from 'shared/ui/track-list'

interface PlaylistTrackItemProps {
  artwork: string
  audioUrl?: null | string
  cacheTrigger?: number
  currentAudioId?: string
  downloadingUrl?: null | string
  id: string | undefined
  index: number
  isPlaying: boolean
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
