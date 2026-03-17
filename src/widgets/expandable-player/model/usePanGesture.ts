import { Gesture } from 'react-native-gesture-handler'
import { runOnJS, withTiming } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'

interface UsePanGestureParams {
  onClose: () => void
  progress: SharedValue<number>
}

export const usePanGesture = ({ onClose, progress }: UsePanGestureParams) => {
  const gestureClose = () => void onClose()

  return Gesture.Pan()
    .onUpdate(e => {
      'worklet'
      if (progress.value >= 0.9 && e.translationY > 0)
        progress.value = Math.max(0, 1 - e.translationY / 400)
    })
    .onEnd(e => {
      'worklet'
      if (e.velocityY > 500 || e.translationY > 100) {
        progress.value = withTiming(0, { duration: 250 })
        runOnJS(gestureClose)()
      } else progress.value = withTiming(1, { duration: 300 })
    })
}
