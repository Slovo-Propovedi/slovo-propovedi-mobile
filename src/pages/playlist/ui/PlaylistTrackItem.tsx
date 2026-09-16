import { memo, useCallback } from 'react'
import { StyleSheet } from 'react-native'
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
    const handlePress = useCallback(() => onPress(index), [index, onPress])

    return (
      <TracksListItem
        title={title}
        artwork={artwork}
        style={styles.row}
        subtitle={subtitle}
        onPress={handlePress}
        progress={storedProgress}
        menuActions={menuActions}
        cacheTrigger={cacheTrigger}
        audioUrl={audioUrl ?? undefined}
        isPlaying={currentAudioId === id}
        isAudioPlaying={currentAudioId === id && isPlaying}
      />
    )
  },
)

const styles = StyleSheet.create({
  row: {
    marginHorizontal: INDENTS.medium,
  },
})
