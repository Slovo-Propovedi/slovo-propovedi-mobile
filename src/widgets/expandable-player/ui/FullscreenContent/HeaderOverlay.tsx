import { Entypo } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { scheduleOnRN } from 'react-native-worklets'
import type { createStyles } from '../ExpandablePlayer/styles'

interface HeaderOverlayProps {
  closePlaylistOnSwipe: () => void
  collapseOnPan: () => void
  collapseOnTap: () => void
  hasNextSermon: boolean
  insetsTop: number
  nextSermonTitle: string | undefined
  onNextSermon: () => void
  styles: ReturnType<typeof createStyles>
}

export const HeaderOverlay = ({
  closePlaylistOnSwipe,
  collapseOnPan,
  collapseOnTap,
  hasNextSermon,
  insetsTop,
  nextSermonTitle,
  onNextSermon,
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
      {hasNextSermon && (
        <Pressable
          onPress={() => void onNextSermon()}
          style={[styles.nextSermonContainer, { top: insetsTop }]}
        >
          <Text style={styles.nextSermonLabel}>следующая проповедь</Text>
          <Text numberOfLines={1} style={styles.nextSermonTitle}>
            {nextSermonTitle}
          </Text>
        </Pressable>
      )}
    </>
  )
}
