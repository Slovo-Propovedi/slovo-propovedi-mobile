import { useAtom } from '@reatom/npm-react'
import { Gesture } from 'react-native-gesture-handler'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import type { SharedValue } from 'react-native-reanimated'
import { showPlaylistAtom } from '../model/showPlaylistAtom'

interface UseFullscreenPanGestureParams {
  close: () => void
  disabled?: boolean
  expanded: boolean
  progress: SharedValue<number>
  screenHeight: number
}

export const useFullscreenPanGesture = ({
  close,
  disabled = false,
  expanded,
  progress,
  screenHeight,
}: UseFullscreenPanGestureParams) => {
  const [showPlaylist, setShowPlaylist] = useAtom(showPlaylistAtom)
  const startY = useSharedValue(0)

  return expanded && !disabled
    ? Gesture.Pan()
        .activeOffsetY(15)
        .onStart(() => {
          'worklet'
          if (showPlaylist) {
            scheduleOnRN(setShowPlaylist, false)
            return
          }
          startY.value = progress.value
        })
        .onUpdate(e => {
          'worklet'
          if (showPlaylist) return
          const dragProgress = e.translationY / (screenHeight - 100)
          // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: intentional .value mutation in gesture worklet
          progress.value = Math.max(0, 1 - dragProgress)
        })
        .onEnd(e => {
          'worklet'
          if (showPlaylist) return
          if (e.velocityY > 500 || progress.value < 0.5) {
            // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: intentional .value mutation in gesture worklet
            progress.value = withTiming(0, { duration: 250 })
            scheduleOnRN(close)
          } else progress.value = withTiming(1, { duration: 300 })
        })
    : Gesture.Pan().enabled(false)
}
