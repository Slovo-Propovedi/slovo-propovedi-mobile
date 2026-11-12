import { memo, type ReactElement } from 'react'
import { buildHistoryMenuActions } from 'entities/listening-history'
import { useTrackItemCache } from 'entities/offline-cache'
import { type AudioPlayerData, type SermonData, toAudioPlayerData } from 'entities/sermon'
import { TracksListItem } from 'entities/track-list'
import { formatScripture } from '../lib/formatScripture'

export const SermonSearchRow = memo(
  ({
    inHistory = false,
    menuButtonWrapper,
    onAddToPlaylist,
    onPress,
    onRemoveFromSearchHistory,
    progress,
    sermon,
  }: {
    inHistory?: boolean
    menuButtonWrapper?: (button: ReactElement) => ReactElement
    onAddToPlaylist?: (sermon: AudioPlayerData) => void
    onPress: () => void
    onRemoveFromSearchHistory?: () => void
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
          onRemoveFromSearchHistory,
          playlist: sermon.playlists?.[0],
          sermon: audio,
        })
      : undefined

    return (
      <TracksListItem
        sermon={sermon}
        onPress={onPress}
        isPlaying={false}
        subtitle={subtitle}
        progress={progress}
        title={sermon.title}
        cacheState={cacheState}
        artwork={sermon.artwork}
        menuActions={menuActions}
        audioUrl={audio?.audioUrl}
        renderMenuButton={menuButtonWrapper}
      />
    )
  },
)
