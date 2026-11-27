import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  BAR_ROW_MIN_HEIGHT,
  BAR_TOP_ISLAND_MARGIN,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from '../layout/bottomBarLayout'
import { useIsWideLayout } from '../layout/lib/useIsWideLayout'
import { INDENTS } from '../theme/themed'

const TEST_ID = 'wide-top-actions'

// The wide island is bottom-anchored inside the chrome row, so its top edge sits
// the row's leftover height below the row top. The actions centre on the island's
// own height, not the taller row, so they land exactly on its middle line.
const ACTIONS_TOP = BAR_TOP_ISLAND_MARGIN + BAR_ROW_MIN_HEIGHT - TAB_BAR_ISLAND_HEIGHT_EXPANDED

/**
 * Fixed top-right actions slot for the wide layout. It mirrors the floating top
 * island's vertical middle, above the scrolling content and below the chrome,
 * and lets touches pass through its empty area. Mount it inside the safe-area
 * padded body (the same origin the floating chrome measures from): `top` is
 * relative to that body, so no safe-area inset is added twice.
 * @param root0 - Component props.
 * @param root0.children - Action buttons rendered in the slot.
 */
export const WideTopActions = ({ children }: { children: ReactNode }) => {
  const isWide = useIsWideLayout()

  if (!isWide) return null

  return (
    <View testID={TEST_ID} pointerEvents='box-none' style={styles.container}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
    height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
    position: 'absolute',
    right: INDENTS.low,
    top: ACTIONS_TOP,
    zIndex: 5,
  },
})
