import { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { clampProgress } from './getIslandMath'
import { getSearchButtonGeometry } from './getSearchButtonGeometry'

interface SearchSeparationInput {
  /** Pre-paint chrome content width the slots are sized from (the layout base). */
  contentWidth: SharedValue<number>
  /** Expanded width of the search slot inside the compact island. */
  expandedSearchWidth: SharedValue<number>
  /** Expanded width of one routed tab slot. */
  expandedTabWidth: SharedValue<number>
  /** Height axis of the bar (the button height follows the island height). */
  oneLineProgress: SharedValue<number>
  /** Visible routed tabs before the search slot. */
  routeCount: number
  /** Pre-paint window width channel (written before paint on rotation). */
  screenWidth: SharedValue<number>
  /** Shape axis: 0 = in-island slot, 1 = detached search circle. */
  separation: SharedValue<number>
  tabBarHeight: number
}

// Animated surfaces of the one detached search button.
//
// `buttonStyle` interpolates the element's rect between the in-island slot and
// the search circle; `glassStyle` fades the button's OWN glass in exactly as it
// leaves the island's glass (and out as it merges back); `capsuleStyle` lets the
// active-search highlight ride the same element once the circle owns the row.
// Separation IS the tab island's shape progress, so both motions stay frame
// synced without a second clock.
export const useSearchSeparation = ({
  contentWidth,
  expandedSearchWidth,
  expandedTabWidth,
  oneLineProgress,
  routeCount,
  screenWidth,
  separation,
  tabBarHeight,
}: SearchSeparationInput) => {
  const buttonStyle = useAnimatedStyle(() =>
    getSearchButtonGeometry({
      contentWidth: contentWidth.value,
      expandedSearchWidth: expandedSearchWidth.value,
      expandedTabWidth: expandedTabWidth.value,
      oneLineProgress: oneLineProgress.value,
      routeCount,
      screenWidth: screenWidth.value,
      separation: separation.value,
      tabBarHeight,
    }),
  )
  const glassStyle = useAnimatedStyle(() => ({ opacity: clampProgress(separation.value) }))
  const capsuleStyle = useAnimatedStyle(() => ({ opacity: clampProgress(separation.value) }))

  return { buttonStyle, capsuleStyle, glassStyle }
}
