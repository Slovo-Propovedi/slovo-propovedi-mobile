import { memo } from 'react'
import { useTrackItemCache } from 'entities/offline-cache'
import { type SermonData, sermonSubtitle, toAudioPlayerData } from 'entities/sermon'
import { TracksListItem } from 'entities/track-list'

export const SermonResultRow = memo(
  ({
    onPress,
    progress,
    sermon,
  }: {
    onPress: (sermon: SermonData) => void
    progress?: number
    sermon: SermonData
  }) => {
    const audio = toAudioPlayerData(sermon)
    const cacheState = useTrackItemCache(audio?.audioUrl)

    return (
      <TracksListItem
        isPlaying={false}
        progress={progress}
        title={sermon.title}
        cacheState={cacheState}
        artwork={sermon.artwork}
        audioUrl={audio?.audioUrl}
        onPress={() => onPress(sermon)}
        subtitle={sermonSubtitle(sermon)}
      />
    )
  },
)
