import { useAtom } from '@reatom/npm-react'
import { memo, useCallback, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { type OfflineSermonItem } from 'features/offline-sermons'
import { useHistoryProgress } from 'entities/listening-history'
import { useTrackItemCache } from 'entities/offline-cache'
import { currentAudioAtom, usePlayNewSermon } from 'entities/player'
import { type SermonData } from 'entities/sermon'
import { TracksListItem } from 'entities/track-list'
import { reportError } from 'shared/model/error-dialog'
import { type MenuItem } from 'shared/ui/menu'
import { INDENTS } from 'shared/ui/theme'

const PLAYBACK_ERROR_MESSAGE = 'Не удалось воспроизвести офлайн-проповедь'
const ADD_TO_PLAYLIST_TEXT = 'Добавить в плейлист'

const styles = StyleSheet.create({
  row: { marginHorizontal: INDENTS.medium },
})

export const OfflineRow = memo(
  ({
    isPlaying,
    item,
    onAddToPlaylist,
  }: {
    isPlaying: boolean
    item: OfflineSermonItem
    onAddToPlaylist?: (sermon: SermonData) => void
  }) => {
    const playNewSermon = usePlayNewSermon()
    const [currentAudio] = useAtom(currentAudioAtom)
    const isCurrentAudio = currentAudio?.id === item.sermon.id
    const storedProgress = useHistoryProgress(item.sermon.id)
    const cacheState = useTrackItemCache(item.sermon.audioUrl)

    const handlePress = useCallback(async () => {
      try {
        await playNewSermon({ playlist: item.playlist, sermon: item.sermon })
      } catch (error) {
        reportError(error, PLAYBACK_ERROR_MESSAGE)
      }
    }, [item, playNewSermon])

    const menuActions = useMemo<MenuItem[] | undefined>(() => {
      if (!onAddToPlaylist) return undefined
      return [
        {
          icon: 'add-circle',
          onPress: () => onAddToPlaylist(item.sermon),
          text: ADD_TO_PLAYLIST_TEXT,
        },
      ]
    }, [item.sermon, onAddToPlaylist])

    return (
      <TracksListItem
        style={styles.row}
        onPress={handlePress}
        cacheState={cacheState}
        title={item.sermon.title}
        progress={storedProgress}
        menuActions={menuActions}
        isPlaying={isCurrentAudio}
        artwork={item.sermon.artwork}
        subtitle={item.playlist.title}
        audioUrl={item.sermon.audioUrl}
        isAudioPlaying={isCurrentAudio && isPlaying}
      />
    )
  },
)
