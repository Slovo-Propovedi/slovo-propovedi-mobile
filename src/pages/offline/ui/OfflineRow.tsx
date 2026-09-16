import { useAtom } from '@reatom/npm-react'
import { memo, useCallback } from 'react'
import { StyleSheet } from 'react-native'
import { type OfflineSermonItem } from 'features/offline-sermons'
import { useHistoryProgress } from 'entities/listening-history'
import { currentAudioAtom, usePlayNewSermon } from 'entities/player'
import { reportError } from 'shared/model/error-dialog'
import { INDENTS } from 'shared/ui/theme'
import { TracksListItem } from 'shared/ui/track-list'

const PLAYBACK_ERROR_MESSAGE = 'Не удалось воспроизвести офлайн-проповедь'

const styles = StyleSheet.create({
  row: { marginHorizontal: INDENTS.medium },
})

interface OfflineRowProps {
  isPlaying: boolean
  item: OfflineSermonItem
}

export const OfflineRow = memo(({ isPlaying, item }: OfflineRowProps) => {
  const playNewSermon = usePlayNewSermon()
  const [currentAudio] = useAtom(currentAudioAtom)
  const isCurrentAudio = currentAudio?.id === item.sermon.id
  const storedProgress = useHistoryProgress(item.sermon.id)

  const handlePress = useCallback(async () => {
    try {
      await playNewSermon({ playlist: item.playlist, sermon: item.sermon })
    } catch (error) {
      reportError(error, PLAYBACK_ERROR_MESSAGE)
    }
  }, [item, playNewSermon])

  return (
    <TracksListItem
      style={styles.row}
      onPress={handlePress}
      title={item.sermon.title}
      progress={storedProgress}
      isPlaying={isCurrentAudio}
      artwork={item.sermon.artwork}
      subtitle={item.playlist.title}
      audioUrl={item.sermon.audioUrl}
      isAudioPlaying={isCurrentAudio && isPlaying}
    />
  )
})
