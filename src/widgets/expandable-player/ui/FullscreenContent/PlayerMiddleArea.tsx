import { Pressable } from 'react-native'
import { type AudioPlayerData } from 'entities/sermon'
import { hapticLight } from 'shared/lib/haptics'
import { type createStyles } from '../ExpandablePlayer/styles'
import { DetailsOverlay } from './DetailsOverlay'

export const PlayerMiddleArea = ({
  audio,
  insetsTop,
  onCloseDetails,
  onTogglePlay,
  showDetails,
  styles,
}: {
  audio: AudioPlayerData
  insetsTop: number
  onCloseDetails: () => void
  onTogglePlay: () => void
  showDetails: boolean
  styles: ReturnType<typeof createStyles>
}) =>
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
