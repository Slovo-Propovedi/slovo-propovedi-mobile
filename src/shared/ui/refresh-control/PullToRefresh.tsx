import { useCallback, useMemo } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { useIsWideLayout } from '../layout/lib/useIsWideLayout'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { getRefreshSpinnerColor, SPINNER_SLOT_HEIGHT } from './pull-to-refresh.lib'
import { type PullToRefreshProps } from './pull-to-refresh.types'
import { RefreshContext } from './refreshContext'
import { usePullToRefreshGesture } from './usePullToRefreshGesture'

/**
 * Web pull-to-refresh wrapper: react-native's `RefreshControl` is a no-op here,
 * so this adds a touch-driven gesture around any scrollable child. The content
 * slides down while pulling and a spinner appears in the freed top slot. The
 * handler is also shared via `RefreshContext` for the desktop `RefreshButton`.
 *
 * The wide layout has no spinner here: the fixed `WideTopActions` overlay hosts
 * it, reading the same `RefreshContext`. The pull gesture still slides the
 * content, it just leaves the spinner to that container. Compact keeps the
 * in-wrapper slot.
 * @param root0 - Component props.
 * @param root0.children - Scrollable content wrapped by the gesture.
 * @param root0.onRefresh - Reload callback fired when a pull passes the threshold.
 * @param root0.refreshing - Controlled spinner state owned by the parent.
 */
export const PullToRefresh = ({ children, onRefresh, refreshing }: PullToRefreshProps) => {
  const { currentTheme } = useTheme()
  const isWide = useIsWideLayout()
  // Live gesture progress shared with the wide overlay spinner: a shared value
  // avoids a re-render on every touch move.
  const pullProgress = useSharedValue(0)
  const handleProgress = useCallback(
    (progress: number) => {
      pullProgress.set(progress)
    },
    [pullProgress],
  )
  const { contentRef, isArmed, spinnerRef, wrapperRef } = usePullToRefreshGesture({
    onProgress: handleProgress,
    onRefresh,
    refreshing,
  })
  const refreshContext = useMemo(
    () => ({ isArmed, onRefresh, pullProgress, refreshing }),
    [isArmed, onRefresh, pullProgress, refreshing],
  )

  return (
    <RefreshContext.Provider value={refreshContext}>
      <View ref={wrapperRef} style={styles.wrapper}>
        {isWide ? null : (
          <View ref={spinnerRef} pointerEvents='none' style={styles.spinnerSlot}>
            <ActivityIndicator color={getRefreshSpinnerColor(isArmed, currentTheme)} />
          </View>
        )}
        <View ref={contentRef} style={styles.content}>
          {children}
        </View>
      </View>
    </RefreshContext.Provider>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  spinnerSlot: {
    alignItems: 'center',
    height: SPINNER_SLOT_HEIGHT,
    justifyContent: 'center',
    left: 0,
    opacity: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    // Above the scrolling content (0), below the floating chrome (10): the
    // content's own `translateY` makes it a stacking context that would
    // otherwise cover the spinner in the wide layout.
    zIndex: 5,
  },
  wrapper: {
    flex: 1,
    overscrollBehavior: 'contain',
  },
})
