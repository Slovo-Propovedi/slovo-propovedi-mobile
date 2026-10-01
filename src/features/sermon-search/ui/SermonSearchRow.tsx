import { memo } from 'react'
import { buildHistoryMenuActions } from 'entities/listening-history'
import { useTrackItemCache } from 'entities/offline-cache'
import { type AudioPlayerData, type SermonData, toAudioPlayerData } from 'entities/sermon'
import { TracksListItem } from 'entities/track-list'
import { formatScripture } from '../lib/formatScripture'

export const SermonSearchRow = memo(
  ({
    inHistory = false,
    onAddToPlaylist,
    onPress,
    progress,
    sermon,
  }: {
    inHistory?: boolean
    onAddToPlaylist?: (sermon: AudioPlayerData) => void
    onPress: () => void
    progress?: number
    sermon: SermonData
  }) => {
    const audio = toAudioPlayerData(sermon)
    const cacheState = useTrackItemCache(audio?.audioUrl)
    const subtitle = [sermon.artist, formatScripture(sermon)].filter(Boolean).join(' • ')

    const menuActions = audio
      ? buildHistoryMenuActions({
          inHistory,
          isCompleted: progress === 1,
          onAddToPlaylist,
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
        cacheState={cacheState}
        artwork={sermon.artwork}
        menuActions={menuActions}
        audioUrl={audio?.audioUrl}
      />
    )
  },
)
