import { memo } from 'react'
import { buildHistoryMenuActions } from 'entities/listening-history'
import { type SermonData, toAudioPlayerData } from 'shared/model'
import { TracksListItem } from 'shared/ui/track-list'
import { formatScripture } from '../lib/formatScripture'

interface SermonSearchRowProps {
  inHistory?: boolean
  onPress: () => void
  progress?: number
  sermon: SermonData
}

export const SermonSearchRow = memo(
  ({ inHistory = false, onPress, progress, sermon }: SermonSearchRowProps) => {
    const audio = toAudioPlayerData(sermon)
    const subtitle = [sermon.artist, formatScripture(sermon)].filter(Boolean).join(' • ')

    const menuActions = audio
      ? buildHistoryMenuActions({
          inHistory,
          isCompleted: progress === 1,
          playlist: sermon.playlists?.[0],
          sermon: audio,
        })
      : undefined

    return (
      <TracksListItem
        onPress={onPress}
        isPlaying={false}
        subtitle={subtitle}
        progress={progress}
        title={sermon.title}
        artwork={sermon.artwork}
        menuActions={menuActions}
        audioUrl={audio?.audioUrl}
      />
    )
  },
)
