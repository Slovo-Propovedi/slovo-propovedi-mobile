import { useEffect, useRef } from 'react'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'

/**
 * Shared 0→1 progress of the bottom-bar morph (0 = detached mini pill above the
 * row, 1 = pill inside the collapsed bottom line). Animates with the same
 * duration as the tab-bar island morph so both move in sync. The first render
 * assigns directly so a surface mounted already collapsed never animates in.
 * @param isCollapsed - Whether the bottom bar is currently collapsed.
 */
export const useBarMorphProgress = (isCollapsed: boolean) => {
  const progress = useSharedValue(isCollapsed ? 1 : 0)
  const isFirstRunRef = useRef(true)

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      progress.value = isCollapsed ? 1 : 0
      return
    }
    progress.value = withTiming(isCollapsed ? 1 : 0, { duration: BAR_MORPH_DURATION_MS })
  }, [isCollapsed, progress])

  return progress
}
