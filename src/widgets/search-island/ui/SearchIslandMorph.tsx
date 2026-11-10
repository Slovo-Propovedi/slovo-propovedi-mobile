import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { Keyboard, useWindowDimensions } from 'react-native'
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { isTabIslandCollapsedAtom } from 'widgets/tab-bar/@x/morph'
import { closeSearch, useIsSearchFieldVisible, useOpenSearch } from 'features/sermon-search'
import { isSearchFieldVisibleAtom } from 'features/sermon-search/@x/barMorph'
import { useAtomMorph } from 'shared/lib/hooks/useAtomMorph'
import { GlassIsland } from 'shared/ui'
import { BAR_MORPH_DURATION_MS, tabBarHeightAtom } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'
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
  const [isTabCollapsed] = useAtom(isTabIslandCollapsedAtom)
  const isSearchFieldVisible = useIsSearchFieldVisible()
  const openSearch = useOpenSearch()
  const closeSearchAction = useAction(closeSearch)
  const [isFocused, setIsFocused] = useState(false)
  // Both morphs subscribe to their atom, so they start in the same tick as the
  // tab island instead of waiting for a React commit.
  const barProgress = useAtomMorph(isTabIslandCollapsedAtom, BAR_MORPH_DURATION_MS)
  const openProgress = useAtomMorph(isSearchFieldVisibleAtom, BAR_MORPH_DURATION_MS)
  const closeProgress = useSharedValue(isFocused ? 1 : 0)

  useEffect(() => {
    closeProgress.value = withTiming(isFocused ? 1 : 0, { duration: BAR_MORPH_DURATION_MS })
  }, [closeProgress, isFocused])

  const handleCloseSearch = useCallback(() => {
    Keyboard.dismiss()
    void closeSearchAction()
  }, [closeSearchAction])

  const frameStyle = useAnimatedStyle(() => {
    const { closeRight, iconInset, iconSize, radius, ...geometry } = getSearchIslandGeometry({
      barProgress: barProgress.value,
      closeProgress: closeProgress.value,
      openProgress: openProgress.value,
      screenWidth,
      tabBarHeight,
    })

    return { ...geometry, borderRadius: radius, paddingLeft: iconInset }
  })

  // Plain restatement of the settled frame, applied after the animated style:
  // the glass theme remount re-commits first-render shadow-tree values, so the
  // pill must not fall back to its launch geometry (Issue #63).
  const settledOpenProgress = isSearchFieldVisible ? 1 : 0
  const settledCloseProgress = isFocused ? 1 : 0
  const {
    closeRight: restingCloseRight,
    iconInset: restingIconInset,
    iconSize: restingIconSize,
    radius: restingRadius,
    ...restingGeometry
  } = getSearchIslandGeometry({
    barProgress: isTabCollapsed ? 1 : 0,
    closeProgress: settledCloseProgress,
    openProgress: settledOpenProgress,
    screenWidth,
    tabBarHeight,
  })
  const restingFrameStyle = {
    ...restingGeometry,
    borderRadius: restingRadius,
    paddingLeft: restingIconInset,
  }
  const closeSlotRestingStyle = {
    borderRadius: restingGeometry.height / 2,
    bottom: restingGeometry.bottom,
    height: restingGeometry.height,
    opacity: settledOpenProgress * settledCloseProgress,
    right: restingCloseRight,
    transform: [{ scale: 0.8 + 0.2 * settledCloseProgress }],
    width: restingGeometry.height,
  }

  return (
    <>
      <GlassIsland
        isLight={isLight}
        pointerEvents='auto'
        hostStyle={styles.container}
        animatedStyle={[frameStyle, restingFrameStyle]}
      >
        <SearchIslandMagnifier
          barProgress={barProgress}
          screenWidth={screenWidth}
          openProgress={openProgress}
          tabBarHeight={tabBarHeight}
        />
        <SearchIslandContent
          onOpenSearch={openSearch}
          openProgress={openProgress}
          onFocusChange={setIsFocused}
          isVisible={isSearchFieldVisible}
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
        isVisible={isSearchFieldVisible && isFocused}
      />
    </>
  )
}
