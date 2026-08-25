import { useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'

/**
 * Snap progress on foreground resume — cancels any in-flight withTiming
 * and forces the shared value onto the UI thread, killing stale
 * mid-animation values that can desync after a long background (Issue #61).
 * @param expanded - Whether the player is currently in expanded (fullscreen) state.
 * @param progress - Shared value tracking expand/collapse animation progress (0 = mini, 1 = full).
 */
export const useAppStateSnap = (expanded: boolean, progress: SharedValue<number>) => {
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') progress.value = expanded ? 1 : 0
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [expanded, progress])
}
