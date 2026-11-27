import { type ReactNode, useContext } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { WIDE_ACTIONS_TOP, WIDE_TAB_ISLAND_HEIGHT } from '../layout/bottomBarLayout'
import { useIsWideLayout } from '../layout/lib/useIsWideLayout'
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
 * It is also the single host of the wide refresh spinner: while the nearest
 * `PullToRefresh` reports `refreshing`, a spinner slot appears before the action
 * buttons inside the same centred row. The slot is `MIN_TOUCH_TARGET` square, so
 * its appearance never changes the row's vertical centring.
 * @param root0 - Component props.
 * @param root0.children - Action buttons rendered in the slot.
 */
export const WideTopActions = ({ children }: { children: ReactNode }) => {
  const isWide = useIsWideLayout()
  const isRefreshing = useContext(RefreshContext)?.refreshing ?? false
  const { currentTheme } = useTheme()

  if (!isWide) return null

  return (
    <View testID={TEST_ID} pointerEvents='box-none' style={styles.container}>
      {isRefreshing ? (
        <View testID={SPINNER_ID} pointerEvents='none' style={styles.spinner}>
          <ActivityIndicator color={currentTheme.primary} />
        </View>
      ) : null}
      {children}
    </View>
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
    width: MIN_TOUCH_TARGET,
  },
})
