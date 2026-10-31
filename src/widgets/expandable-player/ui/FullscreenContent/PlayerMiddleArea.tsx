import { useRef } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { type AudioPlayerData } from 'entities/sermon'
import { hapticLight } from 'shared/lib/haptics'
import { CoverImage } from 'shared/ui'
import { type createStyles } from '../ExpandablePlayer/styles'
import { DetailsOverlay } from './DetailsOverlay'
import { type SeekDirection } from './keyboardTargetGuards'
import { PlayerEdgeSeekZones } from './PlayerEdgeSeekZones'

// Pan activates at 15px, so a pointer that moved further than this was a drag,
// not a tap.
const MAX_TAP_DRIFT_PX = 10

export const PlayerMiddleArea = ({
  audio,
  insetsTop,
  onCloseDetails,
  onTogglePlay,
  showDetails,
  startSeek,
  stopSeek,
  styles,
  tapSeek,
}: {
  audio: AudioPlayerData
  insetsTop: number
  onCloseDetails: () => void
  onTogglePlay: () => void
  showDetails: boolean
  startSeek: (direction: SeekDirection) => void
  stopSeek: () => void
  styles: ReturnType<typeof createStyles>
  tapSeek: (direction: SeekDirection) => void
}) => {
  const pressStartRef = useRef<{ x: number; y: number } | null>(null)

  if (showDetails)
    return (
      <DetailsOverlay
        audio={audio}
        styles={styles}
        insetsTop={insetsTop}
        onClose={onCloseDetails}
      />
    )

  return (
    <View style={styles.spacer}>
      <Pressable
        tabIndex={-1}
        testID='player-middle-area-tap'
        style={StyleSheet.absoluteFill}
        onPressIn={event => {
          pressStartRef.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }
        }}
        onPress={event => {
          // On web RNGH never cancels the RNW press, so a pointer-up after a
          // swipe-down still emits click (see HeaderOverlay, docs/architecture.md).
          // A real tap never drifts; swallow presses that moved with the pan.
          const start = pressStartRef.current
          pressStartRef.current = null

          if (start) {
            const drift = Math.hypot(
              event.nativeEvent.pageX - start.x,
              event.nativeEvent.pageY - start.y,
            )
            if (drift > MAX_TAP_DRIFT_PX) return
          }

          hapticLight()
          void onTogglePlay()
        }}
      />
      <View pointerEvents='none' style={styles.fullscreenArtworkWrapper}>
        <CoverImage eager transition={0} uri={audio.artwork} style={styles.fullscreenArtwork} />
      </View>
      <PlayerEdgeSeekZones tapSeek={tapSeek} stopSeek={stopSeek} startSeek={startSeek} />
    </View>
  )
}
