import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { SPINNER_SLOT_HEIGHT } from './pull-to-refresh.lib'
import { type PullToRefreshProps } from './pull-to-refresh.types'
import { usePullToRefreshGesture } from './usePullToRefreshGesture'

/**
 * Web pull-to-refresh wrapper: react-native's `RefreshControl` is a no-op here,
 * so this adds a touch-driven gesture around any scrollable child. The content
 * slides down while pulling and a spinner appears in the freed top slot.
 * @param root0 - Component props.
 * @param root0.children - Scrollable content wrapped by the gesture.
 * @param root0.onRefresh - Reload callback fired when a pull passes the threshold.
 * @param root0.refreshing - Controlled spinner state owned by the parent.
 */
export const PullToRefresh = ({ children, onRefresh, refreshing }: PullToRefreshProps) => {
  const { currentTheme } = useTheme()
  const { contentRef, isArmed, spinnerRef, wrapperRef } = usePullToRefreshGesture({
    onRefresh,
    refreshing,
  })

  return (
    <View ref={wrapperRef} style={styles.wrapper}>
      <View ref={spinnerRef} pointerEvents='none' style={styles.spinnerSlot}>
        <ActivityIndicator color={isArmed ? currentTheme.primary : currentTheme.textMuted} />
      </View>
      <View ref={contentRef} style={styles.content}>
        {children}
      </View>
    </View>
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
    overscrollBehavior: 'contain',
  },
})
