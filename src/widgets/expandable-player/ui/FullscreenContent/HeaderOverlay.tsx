import { Entypo } from '@expo/vector-icons'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { IconButton } from 'shared/ui/icon-button'
import type { createStyles } from '../ExpandablePlayer/styles'
import { NextSermonPlate } from './NextSermonPlate'
import { StopAllCachingButton } from './StopAllCachingButton'

interface HeaderOverlayProps {
  closePlaylistOnSwipe: () => void
  collapseOnPan: () => void
  collapseOnTap: () => void
  currentAudioId: string
  hasNextSermon: boolean
  insetsTop: number
  nextSermonTitle: string | undefined
  styles: ReturnType<typeof createStyles>
}

export const HeaderOverlay = ({
  closePlaylistOnSwipe,
  collapseOnPan,
  collapseOnTap,
  currentAudioId,
  hasNextSermon,
  insetsTop,
  nextSermonTitle,
  styles,
}: HeaderOverlayProps) => {
  const isPanActive = useSharedValue(false)

  const markPanActive = () => {
    isPanActive.value = true
  }

  const markPanInactive = () => {
    isPanActive.value = false
  }

  const closePanGesture = Gesture.Pan()
    .activeOffsetY(15)
    .onStart(() => {
      'worklet'
      scheduleOnRN(markPanActive)
      scheduleOnRN(closePlaylistOnSwipe)
    })
    .onEnd(event => {
      'worklet'
      if (event.velocityY > 300 || event.translationY > 100) scheduleOnRN(collapseOnPan)
      scheduleOnRN(markPanInactive)
    })
    .onFinalize(() => {
      'worklet'
      scheduleOnRN(markPanInactive)
    })

  return (
    <>
      <GestureDetector gesture={closePanGesture}>
        <IconButton
          accessibilityLabel='Свернуть плеер'
          style={[styles.closeButton, { top: insetsTop }]}
          Icon={<Entypo name='chevron-down' style={styles.closeIcon} />}
          onPress={() => {
            // Pan activation marks the shared value; onPress checks it so a pointer-up after a
            // drag never collapses the player (web RNGH does not cancel Pressable press)
            if (isPanActive.value) return
            collapseOnTap()
          }}
        />
      </GestureDetector>
      {hasNextSermon && nextSermonTitle && (
        <NextSermonPlate
          styles={styles}
          insetsTop={insetsTop}
          currentAudioId={currentAudioId}
          nextSermonTitle={nextSermonTitle}
        />
      )}
      <StopAllCachingButton styles={styles} insetsTop={insetsTop} />
    </>
  )
}
