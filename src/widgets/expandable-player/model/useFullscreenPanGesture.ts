import { Gesture } from 'react-native-gesture-handler'
import { runOnJS, useSharedValue, withTiming } from 'react-native-reanimated'
import type React from 'react'
import type { SharedValue } from 'react-native-reanimated'

interface UseFullscreenPanGestureParams {
  close: () => void
  disabled?: boolean
  expanded: boolean
  progress: SharedValue<number>
  screenHeight: number
  setShowPlaylist?: React.Dispatch<React.SetStateAction<boolean>>
  showPlaylist?: boolean
}

export const useFullscreenPanGesture = ({
  close,
  disabled = false,
  expanded,
  progress,
  screenHeight,
  setShowPlaylist,
  showPlaylist,
}: UseFullscreenPanGestureParams) => {
  const startY = useSharedValue(0)

  return expanded && !disabled
    ? Gesture.Pan()
        .activeOffsetY(15)
        .onStart(() => {
          'worklet'
          if (showPlaylist && setShowPlaylist) {
            runOnJS(setShowPlaylist)(false)
            return
          }
          startY.value = progress.value
        })
        .onUpdate(e => {
          'worklet'
          if (showPlaylist) return
          const dragProgress = e.translationY / (screenHeight - 100)
          progress.value = Math.max(0, 1 - dragProgress)
        })
        .onEnd(e => {
          'worklet'
          if (showPlaylist) return
          if (e.velocityY > 500 || progress.value < 0.5) {
            progress.value = withTiming(0, { duration: 250 })
            runOnJS(close)()
          } else progress.value = withTiming(1, { duration: 300 })
        })
    : Gesture.Pan().enabled(false)
}
