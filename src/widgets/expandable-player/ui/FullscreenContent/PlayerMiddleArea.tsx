import { Pressable } from 'react-native'
import { hapticLight } from 'shared/lib/haptics'
import type { createStyles } from '../ExpandablePlayer/styles'
import type { AudioPlayerData } from 'shared/model'
import { DetailsOverlay } from './DetailsOverlay'

interface PlayerMiddleAreaProps {
  audio: AudioPlayerData
  insetsTop: number
  onCloseDetails: () => void
  onTogglePlay: () => void
  showDetails: boolean
  styles: ReturnType<typeof createStyles>
}

export const PlayerMiddleArea = ({
  audio,
  insetsTop,
  onCloseDetails,
  onTogglePlay,
  showDetails,
  styles,
}: PlayerMiddleAreaProps) =>
  showDetails ? (
    <DetailsOverlay audio={audio} styles={styles} insetsTop={insetsTop} onClose={onCloseDetails} />
  ) : (
    <Pressable
      tabIndex={-1}
      style={styles.spacer}
      onPressIn={hapticLight}
      onPress={() => void onTogglePlay()}
    />
  )
