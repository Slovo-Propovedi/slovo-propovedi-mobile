import { type ReactNode, useContext } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import {
  WIDE_ACTIONS_CENTER_Y,
  WIDE_ACTIONS_TOP,
  WIDE_TAB_ISLAND_HEIGHT,
} from '../layout/bottomBarLayout'
import { useIsWideLayout } from '../layout/lib/useIsWideLayout'
import { getRefreshSpinnerColor } from '../refresh-control/pull-to-refresh.lib'
import { RefreshContext } from '../refresh-control/refreshContext'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { INDENTS, MIN_TOUCH_TARGET } from '../theme/themed'

const TEST_ID = 'wide-top-actions'
const SPINNER_ID = 'wide-top-actions-spinner'

/**
 * Fixed top-right actions slot for the wide layout. It mirrors the floating top
 * island's vertical middle, above the scrolling content and below the chrome,
 * and lets touches pass through its empty area. Mount it inside the safe-area
 * padded body (the same origin the floating chrome measures from): `top` is
 * relative to that body, so no safe-area inset is added twice.
 *
 * It is also the single host of the wide refresh spinner: a full-width band
 * pinned to both body edges so its centred content sits on the horizontal centre
 * of the screen, level with the actions row. Its opacity follows the nearest
 * `PullToRefresh` pull (fading in before release) and stays at 1 while the
 * refresh is running.
 * @param root0 - Component props.
 * @param root0.children - Action buttons rendered in the slot.
 */
export const WideTopActions = ({ children }: { children: ReactNode }) => {
  const isWide = useIsWideLayout()
  const context = useContext(RefreshContext)
  const isArmed = context?.isArmed ?? false
  const isRefreshing = context?.refreshing ?? false
  const fallbackProgress = useSharedValue(0)
  const pullProgress = context?.pullProgress ?? fallbackProgress
  const { currentTheme } = useTheme()

  // The slot stays mounted so the shared pull value can fade it in without a
  // re-render per touch move; a running refresh pins it fully visible.
  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: isRefreshing ? 1 : Math.min(Math.max(pullProgress.value, 0), 1),
  }))

  if (!isWide) return null

  return (
    <>
      <Animated.View
        testID={SPINNER_ID}
        pointerEvents='none'
        style={[styles.spinner, spinnerStyle]}
      >
        <ActivityIndicator color={getRefreshSpinnerColor(isRefreshing || isArmed, currentTheme)} />
      </Animated.View>
      <View testID={TEST_ID} pointerEvents='box-none' style={styles.container}>
        {children}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
    height: WIDE_TAB_ISLAND_HEIGHT,
    position: 'absolute',
    right: INDENTS.low,
    top: WIDE_ACTIONS_TOP,
    zIndex: 5,
  },
  spinner: {
    alignItems: 'center',
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: WIDE_ACTIONS_CENTER_Y - MIN_TOUCH_TARGET / 2,
    zIndex: 5,
  },
})
