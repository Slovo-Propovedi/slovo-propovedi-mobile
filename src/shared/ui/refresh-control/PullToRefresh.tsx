import { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useIsWideLayout } from '../layout/lib/useIsWideLayout'
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
 * The wide layout has no spinner here: the fixed `WideTopActions` overlay hosts
 * it, reading the same `RefreshContext`. The pull gesture still slides the
 * content, it just leaves the spinner to that container. Compact keeps the
 * in-wrapper slot.
 * @param root0 - Component props.
 * @param root0.children - Scrollable content wrapped by the gesture.
 * @param root0.onRefresh - Reload callback fired when a pull passes the threshold.
 * @param root0.refreshing - Controlled spinner state owned by the parent.
 * @param root0.topOffset - Extra spinner-slot top offset (compact layout).
 */
export const PullToRefresh = ({
  children,
  onRefresh,
  refreshing,
  topOffset = 0,
}: PullToRefreshProps) => {
  const { currentTheme } = useTheme()
  const isWide = useIsWideLayout()
  const { contentRef, isArmed, spinnerRef, wrapperRef } = usePullToRefreshGesture({
    onRefresh,
    refreshing,
  })
  const refreshContext = useMemo(() => ({ onRefresh, refreshing }), [onRefresh, refreshing])

  return (
    <RefreshContext.Provider value={refreshContext}>
      <View ref={wrapperRef} style={styles.wrapper}>
        {isWide ? null : (
          <View
            ref={spinnerRef}
            pointerEvents='none'
            style={[styles.spinnerSlot, { top: topOffset }]}
          >
            <ActivityIndicator color={isArmed ? currentTheme.primary : currentTheme.textMuted} />
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
