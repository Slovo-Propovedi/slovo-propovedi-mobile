import { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { SPINNER_SLOT_HEIGHT } from './pull-to-refresh.lib'
import { type PullToRefreshProps } from './pull-to-refresh.types'
import { RefreshContext } from './refreshContext'
import { usePullToRefreshGesture } from './usePullToRefreshGesture'

/**
 * Web pull-to-refresh wrapper: react-native's `RefreshControl` is a no-op here,
 * so this adds a touch-driven gesture around any scrollable child. The content
 * slides down while pulling and a spinner appears in the freed top slot. The
 * handler is also shared via `RefreshContext` for the desktop `RefreshButton`.
 *
 * The spinner lives INSIDE the translated content wrapper, anchored in the
 * top inset zone, so it rides the pull like the rest of the content and the
 * hook scrolls it away with the list. It is rendered after `children` so it
 * paints above the scrollable without a zIndex layer of its own.
 * @param root0 - Component props.
 * @param root0.children - Scrollable content wrapped by the gesture.
 * @param root0.onRefresh - Reload callback fired when a pull passes the threshold.
 * @param root0.refreshing - Controlled spinner state owned by the parent.
 * @param root0.topOffset - Spinner-slot top offset inside the scroll content (wide chrome).
 */
export const PullToRefresh = ({
  children,
  onRefresh,
  refreshing,
  topOffset = 0,
}: PullToRefreshProps) => {
  const { currentTheme } = useTheme()
  const { contentRef, isArmed, spinnerRef, wrapperRef } = usePullToRefreshGesture({
    onRefresh,
    refreshing,
  })
  const refreshContext = useMemo(() => ({ onRefresh, refreshing }), [onRefresh, refreshing])

  return (
    <RefreshContext.Provider value={refreshContext}>
      <View ref={wrapperRef} style={styles.wrapper}>
        <View ref={contentRef} style={styles.content}>
          {children}
          <View
            ref={spinnerRef}
            pointerEvents='none'
            style={[styles.spinnerSlot, { top: topOffset }]}
          >
            <ActivityIndicator color={isArmed ? currentTheme.primary : currentTheme.textMuted} />
          </View>
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
  },
  wrapper: {
    flex: 1,
    // The slot follows the scroll content; clip it once it leaves the body.
    overflow: 'hidden',
    overscrollBehavior: 'contain',
  },
})
