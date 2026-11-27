import { useAtom } from '@reatom/npm-react'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { searchFocusMorphDriver } from 'widgets/search-island/@x/morphDrivers'
import { isSearchFieldFocusedAtom } from 'features/sermon-search/@x/barMorph'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import {
  BAR_CIRCLE_SIZE_EXPANDED,
  BAR_SIDE_INSET_EXPANDED,
  CONTENT_COLUMN_WIDTH,
} from 'shared/ui/layout'
import { isTabIslandCollapsedAtom } from '../model/barMorph'
import { oneLineBarMorphDriver } from '../model/oneLineBarMorphDriver'
import { tabIslandMorphDriver } from '../model/tabIslandMorphDriver'
import { getIslandContentStyle } from './getBarMorphStyles'
import {
  getIslandStyle,
  getWideIslandWidth,
  ISLAND_CONTENT_PADDING_HORIZONTAL,
  WIDE_SEARCH_SLOT_WIDTH,
  WIDE_TAB_SLOT_WIDTH,
} from './getIslandStyle'
import { getTabIslandRestingStyles } from './getTabIslandRestingStyles'

interface TabIslandMorphInput {
  hideSearch: boolean
  /**
   * Pin the island to its expanded pose regardless of the scroll/search atoms.
   * The wide layout keeps the bar permanently open at the top of the screen.
   */
  isForceExpanded?: boolean
  /** Visible slots only: the search route is registered but never rendered as a tab. */
  routeCount: number
  /** Row width measured via onLayout; 0 until the first layout pass. */
  rowWidth: number
  windowWidth: number
}

// Drives the island's morph on two axes: the shape axis (expanded ⇄ circle) from
// the tab-island atom, and the height axis from the one-line atom. Both atoms
// cover a visible search field differently on purpose: the field forces the
// SHAPE to a circle (the row reads [circle][field]) but keeps the HEIGHT at 60,
// so the open-field row is a 60x60 circle next to the 60 field. The compact 48
// applies only when the field is hidden AND the bar is one-line. Focus is a
// stronger state: it retracts the island so the pill owns the row.
export const useTabIslandMorph = ({
  hideSearch,
  isForceExpanded = false,
  routeCount,
  rowWidth,
  windowWidth,
}: TabIslandMorphInput) => {
  const [liveIsCollapsed] = useAtom(isTabIslandCollapsedAtom)
  const [isFocused] = useAtom(isSearchFieldFocusedAtom)
  const { progress, settled: settledCollapsed } = useAtomMorphDriver(tabIslandMorphDriver)
  const { progress: oneLineProgress, settled: settledOneLine } =
    useAtomMorphDriver(oneLineBarMorphDriver)
  const { progress: focusProgress, settled: settledFocused } =
    useAtomMorphDriver(searchFocusMorphDriver)
  // Wide pins both axes for the slots too: consumers read this zero progress.
  const expandedProgress = useSharedValue(0)

  // The expanded island follows the expanded side inset; the collapsed circle
  // takes its diameter from the island height and the row's padding.
  const rowContentWidth =
    Math.min(rowWidth || windowWidth, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET_EXPANDED * 2
  // Both layouts fold search into the island: wide always, compact while
  // expanded. Wide pins the island open and hugs its per-kind slot widths
  // (Apple Music iPad pill); the search button is a slot in both.
  const expandedSlotCount = routeCount + (hideSearch ? 0 : 1)
  const expandedIslandWidth = isForceExpanded
    ? getWideIslandWidth(routeCount, !hideSearch)
    : Math.max(BAR_CIRCLE_SIZE_EXPANDED, rowContentWidth)
  const compactSlotWidth =
    (expandedIslandWidth - ISLAND_CONTENT_PADDING_HORIZONTAL * 2) / Math.max(expandedSlotCount, 1)

  const islandStyle = useAnimatedStyle(() =>
    getIslandStyle(
      isForceExpanded ? 0 : progress.value,
      { expandedWidth: expandedIslandWidth },
      focusProgress.value,
      isForceExpanded ? 0 : oneLineProgress.value,
      isForceExpanded,
    ),
  )

  // The island's inner row is padded only while expanded; the collapsed active
  // slot must fill the whole circle, so the padding fades out with the morph.
  const contentStyle = useAnimatedStyle(() =>
    getIslandContentStyle(isForceExpanded ? 0 : progress.value),
  )

  // Plain restatement of the settled geometry, applied after the animated
  // styles: the glass theme remount re-commits shadow-tree props from the first
  // render, so without it the island reverts to its launch shape (Issue #63).
  // The resting layer carries the START geometry mid-morph (`settledCollapsed`
  // and `settledOneLine` lag the atoms until the morph lands) — recomputing it
  // from the live atoms would paint the destination early; live `isCollapsed` gates taps.
  const { content: restingContentStyle, island: restingIslandStyle } = getTabIslandRestingStyles({
    expandedWidth: expandedIslandWidth,
    isWideLayout: isForceExpanded,
    settledFocused,
    settledIsCollapsed: isForceExpanded ? false : settledCollapsed,
    settledOneLine: isForceExpanded ? false : settledOneLine,
  })

  return {
    contentStyle,
    // Compact: every slot gets an equal share of the island minus its padding.
    // Wide: tabs take the label pitch, search only its minimum touch target.
    expandedSearchWidth: isForceExpanded ? WIDE_SEARCH_SLOT_WIDTH : compactSlotWidth,
    expandedTabWidth: isForceExpanded ? WIDE_TAB_SLOT_WIDTH : compactSlotWidth,
    // Target shape of the morph: hidden slots must stop receiving touches as
    // soon as the island is collapsing, not when their width animation lands.
    isCollapsed: isForceExpanded ? false : liveIsCollapsed,
    // Focus removes the island from the row altogether, so its host must stop
    // receiving touches on the focus flip, not when it finishes fading out.
    isFocused,
    islandStyle,
    // Height axis shared with the slots: the collapsed slot width must match the
    // island's current diameter (68 beside an open field, 48 in the compact row).
    oneLineProgress: isForceExpanded ? expandedProgress : oneLineProgress,
    progress: isForceExpanded ? expandedProgress : progress,
    restingContentStyle,
    restingIslandStyle,
    // Settled (lagged) collapse state for the slots' committed resting
    // geometry (TabSlot): it flips only when the morph lands, never mid-morph.
    settledCollapsed: isForceExpanded ? false : settledCollapsed,
    settledOneLine: isForceExpanded ? false : settledOneLine,
  }
}
