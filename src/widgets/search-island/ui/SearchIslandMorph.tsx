import { useAtom } from '@reatom/npm-react'
import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { useAnimatedStyle } from 'react-native-reanimated'
import { oneLineBarMorphDriver } from 'widgets/tab-bar/@x/morph'
import { useCloseSearch, useIsSearchFieldVisible, useOpenSearch } from 'features/sermon-search'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { GlassIsland } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'
import { getSearchIslandRestingStyles } from '../lib/getSearchIslandRestingStyles'
import { useSearchFocusMorph } from '../lib/useSearchFocusMorph'
import { searchFocusMorphDriver } from '../model/searchFocusDriver'
import { searchOpenMorphDriver } from '../model/searchOpenDriver'
import { SearchIslandCloseSlot } from './SearchIslandCloseSlot'
import { SearchIslandContent } from './SearchIslandContent'
import { SearchIslandMagnifier } from './SearchIslandMagnifier'
import { styles } from './SearchIslandMorph.styles'

// One glass frame for the whole search affordance. Closed it is the search
// circle; opened it morphs into the pill. The frame is mounted for the whole
// tab shell (CustomTabBar renders on every tab screen, including the nested
// playlist routes), so the two states are the same node: geometry animates and
// content crossfades. Opening navigates to the `/search` route; closing resets
// the session and leaves it.
export const SearchIslandMorph = () => {
  const { isLight } = useTheme()
  const { width: screenWidth } = useWindowDimensions()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const isSearchFieldVisible = useIsSearchFieldVisible()
  const openSearch = useOpenSearch()
  const closeSearch = useCloseSearch()
  const { closeProgress, handleCloseFocusChange, settledClose, shouldShowClose } =
    useSearchFocusMorph()
  // Every morph is a module-level driver, so this frame and the glass surfaces
  // it sits next to read the same progress values. Their SETTLED flags feed the
  // resting layer; the live progress drives the animated layer. The pill height
  // follows the one-line axis only: opening the field must not shrink the chip
  // to the compact size while the island shape collapses beside it.
  const { progress: oneLineProgress, settled: settledOneLine } =
    useAtomMorphDriver(oneLineBarMorphDriver)
  const { progress: openProgress, settled: settledOpen } = useAtomMorphDriver(searchOpenMorphDriver)
  const { progress: focusProgress, settled: settledFocused } =
    useAtomMorphDriver(searchFocusMorphDriver)

  const frameStyle = useAnimatedStyle(() => {
    const { closeRight, iconInset, iconSize, radius, ...geometry } = getSearchIslandGeometry({
      closeProgress: closeProgress.value,
      focusProgress: focusProgress.value,
      oneLineProgress: oneLineProgress.value,
      openProgress: openProgress.value,
      screenWidth,
      tabBarHeight,
    })

    return { ...geometry, borderRadius: radius, paddingLeft: iconInset }
  })

  // Plain restatement of the settled frame, applied after the animated style:
  // the glass theme remount re-commits first-render shadow-tree values, so the
  // pill must not fall back to its launch geometry (Issue #63). The settled flags
  // lag their morphs, so mid-morph this layer carries the START frame instead of
  // painting the destination a frame early.
  const { closeSlotRestingStyle, restingFrameStyle } = useMemo(
    () =>
      getSearchIslandRestingStyles({
        screenWidth,
        settledClose,
        settledFocused,
        settledOneLine,
        settledOpen,
        tabBarHeight,
      }),
    [settledClose, settledFocused, settledOneLine, settledOpen, screenWidth, tabBarHeight],
  )

  return (
    <>
      {/* Pass-through frame: it only positions its interactive children. */}
      <GlassIsland
        isLight={isLight}
        pointerEvents='box-none'
        hostStyle={styles.container}
        animatedStyle={[frameStyle, restingFrameStyle]}
      >
        <SearchIslandMagnifier />
        <SearchIslandContent
          onOpenSearch={openSearch}
          openProgress={openProgress}
          isVisible={isSearchFieldVisible}
          onFocusChange={handleCloseFocusChange}
        />
      </GlassIsland>
      <SearchIslandCloseSlot
        onPress={closeSearch}
        screenWidth={screenWidth}
        openProgress={openProgress}
        tabBarHeight={tabBarHeight}
        closeProgress={closeProgress}
        oneLineProgress={oneLineProgress}
        restingStyle={closeSlotRestingStyle}
        isVisible={isSearchFieldVisible && shouldShowClose}
      />
    </>
  )
}
