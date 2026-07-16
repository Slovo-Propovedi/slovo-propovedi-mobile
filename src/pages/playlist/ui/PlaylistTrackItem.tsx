import { INDENTS } from 'shared/ui/themed'
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
  title: string
}

export const PlaylistTrackItem = ({
  artwork,
  audioUrl,
  cacheTrigger,
  currentAudioId,
  downloadingUrl,
  id,
  index,
  isPlaying,
  onPress,
  title,
}: PlaylistTrackItemProps) => (
  <TracksListItem
    title={title}
    artwork={artwork}
    artist={undefined}
    cacheTrigger={cacheTrigger}
    onPress={() => onPress(index)}
    downloadingUrl={downloadingUrl}
    audioUrl={audioUrl ?? undefined}
    isPlaying={currentAudioId === id}
    style={{ marginHorizontal: INDENTS.medium }}
    isAudioPlaying={currentAudioId === id && isPlaying}
  />
)
