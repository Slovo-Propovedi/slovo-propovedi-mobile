import { Entypo } from '@expo/vector-icons'
import { View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { scheduleOnRN } from 'react-native-worklets'
import type { createStyles } from '../ExpandablePlayer/styles'
import { NextSermonPlate } from './NextSermonPlate'

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
  const closeTapGesture = Gesture.Tap().onEnd(() => {
    'worklet'
    scheduleOnRN(collapseOnTap)
  })

  const closePanGesture = Gesture.Pan()
    .activeOffsetY(15)
    .onStart(() => {
      'worklet'
      scheduleOnRN(closePlaylistOnSwipe)
    })
    .onEnd(event => {
      'worklet'
      if (event.velocityY > 300 || event.translationY > 100) scheduleOnRN(collapseOnPan)
    })

  const closeGesture = Gesture.Race(closeTapGesture, closePanGesture)

  return (
    <>
      <GestureDetector gesture={closeGesture}>
        <View style={[styles.closeButton, { top: insetsTop }]}>
          <Entypo name='chevron-down' style={styles.closeIcon} />
        </View>
      </GestureDetector>
      {hasNextSermon && nextSermonTitle && (
        <NextSermonPlate
          styles={styles}
          insetsTop={insetsTop}
          currentAudioId={currentAudioId}
          nextSermonTitle={nextSermonTitle}
        />
      )}
    </>
  )
}
