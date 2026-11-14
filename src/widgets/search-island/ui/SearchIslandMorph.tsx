import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useMemo } from 'react'
import { Keyboard, useWindowDimensions } from 'react-native'
import { useAnimatedStyle } from 'react-native-reanimated'
import { tabIslandMorphDriver } from 'widgets/tab-bar/@x/morph'
import { closeSearch, useIsSearchFieldVisible, useOpenSearch } from 'features/sermon-search'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { GlassIsland } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'
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
// content crossfades. The shared `BarBackdropShade` gradient sits behind it.
export const SearchIslandMorph = () => {
  const { isLight } = useTheme()
  const { width: screenWidth } = useWindowDimensions()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const isSearchFieldVisible = useIsSearchFieldVisible()
  const openSearch = useOpenSearch()
  const closeSearchAction = useAction(closeSearch)
  const { closeProgress, handleCloseFocusChange, settledClose, shouldShowClose } =
    useSearchFocusMorph()
  // Every morph is a module-level driver, so this frame and the glass surfaces
  // it sits next to read the same progress values. Their SETTLED flags feed the
  // resting layer; the live progress drives the animated layer.
  const { progress: barProgress, settled: settledTabCollapsed } =
    useAtomMorphDriver(tabIslandMorphDriver)
  const { progress: openProgress, settled: settledOpen } = useAtomMorphDriver(searchOpenMorphDriver)
  const { progress: focusProgress, settled: settledFocused } =
    useAtomMorphDriver(searchFocusMorphDriver)

  const handleCloseSearch = useCallback(() => {
    Keyboard.dismiss()
    void closeSearchAction()
  }, [closeSearchAction])

  const frameStyle = useAnimatedStyle(() => {
    const { closeRight, iconInset, iconSize, radius, ...geometry } = getSearchIslandGeometry({
      barProgress: barProgress.value,
      closeProgress: closeProgress.value,
      focusProgress: focusProgress.value,
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
  const { closeSlotRestingStyle, restingFrameStyle } = useMemo(() => {
    const settledOpenProgress = settledOpen ? 1 : 0
    const settledCloseProgress = settledClose ? 1 : 0
    const { closeRight, iconInset, iconSize, radius, ...geometry } = getSearchIslandGeometry({
      barProgress: settledTabCollapsed ? 1 : 0,
      closeProgress: settledCloseProgress,
      focusProgress: settledFocused ? 1 : 0,
      openProgress: settledOpenProgress,
      screenWidth,
      tabBarHeight,
    })

    return {
      closeSlotRestingStyle: {
        borderRadius: geometry.height / 2,
        bottom: geometry.bottom,
        height: geometry.height,
        opacity: settledOpenProgress * settledCloseProgress,
        right: closeRight,
        transform: [{ scale: 0.8 + 0.2 * settledCloseProgress }],
        width: geometry.height,
      },
      restingFrameStyle: { ...geometry, borderRadius: radius, paddingLeft: iconInset },
    }
  }, [settledClose, settledFocused, settledOpen, settledTabCollapsed, screenWidth, tabBarHeight])

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
        progress={barProgress}
        screenWidth={screenWidth}
        onPress={handleCloseSearch}
        openProgress={openProgress}
        tabBarHeight={tabBarHeight}
        closeProgress={closeProgress}
        restingStyle={closeSlotRestingStyle}
        isVisible={isSearchFieldVisible && shouldShowClose}
      />
    </>
  )
}
