import { useCallback } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import { useMarqueeClickGuard } from './useMarqueeClickGuard'
import { useNativeDragGuard } from './useNativeDragGuard'

// The container view hosts both web-only DOM guards: the click guard swallows
// the post-drag click and the native-drag guard blocks HTML5 `dragstart`.
export const useMarqueeContainerRef = (didDrag: SharedValue<boolean>) => {
  const clickGuardRef = useMarqueeClickGuard(didDrag)
  const dragGuardRef = useNativeDragGuard()

  return useCallback(
    (instance: unknown) => {
      clickGuardRef(instance)
      dragGuardRef(instance)
    },
    [clickGuardRef, dragGuardRef],
  )
}
