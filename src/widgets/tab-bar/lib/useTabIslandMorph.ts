import { useAtom } from '@reatom/npm-react'
import { useAnimatedStyle } from 'react-native-reanimated'
import { isSearchFocusActiveAtom } from 'features/sermon-search/@x/barMorph'
import { useAtomMorph } from 'shared/lib/hooks/useAtomMorph'
import {
  BAR_CIRCLE_SIZE,
  BAR_CIRCLE_SIZE_EXPANDED,
  BAR_MORPH_DURATION_MS,
  BAR_OUTER_GAP,
  BAR_SIDE_INSET,
  CONTENT_COLUMN_WIDTH,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { isTabIslandCollapsedAtom } from '../model/barMorph'
import { getIslandContentStyle } from './getBarMorphStyles'
import { getIslandStyle, ISLAND_CONTENT_PADDING_HORIZONTAL } from './getIslandStyle'
import { getTabIslandRestingStyles } from './getTabIslandRestingStyles'

interface TabIslandMorphInput {
  hideSearch: boolean
  routeCount: number
  /** Row width measured via onLayout; 0 until the first layout pass. */
  rowWidth: number
  windowWidth: number
}

// Drives the island's width/height morph (expanded ⇄ circle). The atom also
// covers a visible search field, which forces the collapsed shape even when the
// scroll driver has not collapsed the bar yet, because the row reads
// [active circle][field]. The progress starts in the atom subscription so the
// morph does not wait for this component's render/commit (Android: ~130 ms).
export const useTabIslandMorph = ({
  hideSearch,
  routeCount,
  rowWidth,
  windowWidth,
}: TabIslandMorphInput) => {
  const [isCollapsed] = useAtom(isTabIslandCollapsedAtom)
  const [isFocused] = useAtom(isSearchFocusActiveAtom)
  const { progress, settled: settledCollapsed } = useAtomMorph(
    isTabIslandCollapsedAtom,
    BAR_MORPH_DURATION_MS,
  )
  const { progress: focusProgress, settled: settledFocused } = useAtomMorph(
    isSearchFocusActiveAtom,
    BAR_MORPH_DURATION_MS,
  )

  const rowContentWidth =
    Math.min(rowWidth || windowWidth, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET * 2
  const expandedIslandWidth = Math.max(
    BAR_CIRCLE_SIZE_EXPANDED,
    hideSearch ? rowContentWidth : rowContentWidth - BAR_CIRCLE_SIZE_EXPANDED - BAR_OUTER_GAP,
  )

  const islandStyle = useAnimatedStyle(() =>
    getIslandStyle(
      progress.value,
      {
        collapsedHeight: TAB_BAR_ISLAND_HEIGHT,
        collapsedWidth: BAR_CIRCLE_SIZE,
        expandedHeight: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
        expandedWidth: expandedIslandWidth,
      },
      focusProgress.value,
    ),
  )

  // The island's inner row is padded only while expanded; the collapsed active
  // slot must fill the whole circle, so the padding fades out with the morph.
  const contentStyle = useAnimatedStyle(() => getIslandContentStyle(progress.value))

  // Plain restatement of the settled geometry, applied after the animated
  // styles: the glass theme remount re-commits shadow-tree props from the first
  // render, so without it the island reverts to its launch shape (Issue #63).
  // The resting layer carries the START geometry mid-morph (`settledCollapsed`
  // lags the atom until the morph lands) — recomputing it from the live atom
  // would paint the destination a frame early. Pointer gating still uses the
  // live `isCollapsed`.
  const { content: restingContentStyle, island: restingIslandStyle } = getTabIslandRestingStyles({
    collapsedWidth: BAR_CIRCLE_SIZE,
    expandedWidth: expandedIslandWidth,
    settledFocused,
    settledIsCollapsed: settledCollapsed,
  })

  return {
    contentStyle,
    // The slots own the island width minus its horizontal padding, so the row
    // never overflows the rounded edges.
    expandedTabWidth:
      (expandedIslandWidth - ISLAND_CONTENT_PADDING_HORIZONTAL * 2) / Math.max(routeCount, 1),
    // Target shape of the morph: hidden slots must stop receiving touches as
    // soon as the island is collapsing, not when their width animation lands.
    isCollapsed,
    // Focus removes the island from the row altogether, so its host must stop
    // receiving touches on the focus flip, not when it finishes fading out.
    isFocused,
    islandStyle,
    progress,
    restingContentStyle,
    restingIslandStyle,
  }
}
