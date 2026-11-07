import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { Keyboard, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { closeSearch, SearchBar, useIsSearchFieldVisible } from 'features/sermon-search'
import { createGlassStyles, GlassSurface } from 'shared/ui'
import { BAR_MORPH_DURATION_MS, isBarCollapsedAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { RADIUSES, useTheme } from 'shared/ui/theme'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'
import { SearchIslandCloseSlot } from './SearchIslandCloseSlot'

// The search field that replaces the right search circle while the field is
// visible. The island stays mounted for the whole tab shell: opening morphs it
// out of the bar (the pill's open-progress follows the same timing as the island
// morph), a collapse with an empty query fades it back into the circle, and
// while hidden it stays non-interactive. A hidden island never takes focus.
//
// While the input is focused, a separate ✕ circle appears to the right and the
// pill yields a circle + gap of room to it (both animate with the same morph
// duration, so the row reads as [pill][✕] the whole way).
export const SearchIsland = () => {
  const { isLight } = useTheme()
  const { width: screenWidth } = useWindowDimensions()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const [isBarCollapsed] = useAtom(isBarCollapsedAtom)
  const isSearchFieldVisible = useIsSearchFieldVisible()
  const [isFocused, setIsFocused] = useState(false)
  const closeSearchAction = useAction(closeSearch)
  // A visible field always sits in the collapsed row, so the pill geometry
  // follows the collapsed bar even before the scroll driver writes the atom.
  const progress = useSharedValue(isBarCollapsed || isSearchFieldVisible ? 1 : 0)
  const openProgress = useSharedValue(isSearchFieldVisible ? 1 : 0)
  // Seeded from the focus state so a bar re-rendered while already focused
  // starts with the close slot reserved instead of snapping on the next frame.
  const closeProgress = useSharedValue(isFocused ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(isBarCollapsed || isSearchFieldVisible ? 1 : 0, {
      duration: BAR_MORPH_DURATION_MS,
    })
    openProgress.value = withTiming(isSearchFieldVisible ? 1 : 0, {
      duration: BAR_MORPH_DURATION_MS,
    })
  }, [isBarCollapsed, isSearchFieldVisible, openProgress, progress])

  useEffect(() => {
    closeProgress.value = withTiming(isFocused ? 1 : 0, { duration: BAR_MORPH_DURATION_MS })
  }, [closeProgress, isFocused])

  const handleFocusChange = useCallback((focused: boolean) => {
    setIsFocused(focused)
  }, [])

  const handleCloseSearch = useCallback(() => {
    Keyboard.dismiss()
    void closeSearchAction()
  }, [closeSearchAction])

  const islandStyle = useAnimatedStyle(() => {
    const { radius, ...geometry } = getSearchIslandGeometry({
      barProgress: progress.value,
      closeProgress: closeProgress.value,
      screenWidth,
      tabBarHeight,
    })

    return { ...geometry, borderRadius: radius, opacity: openProgress.value }
  })

  const isCloseVisible = isSearchFieldVisible && isFocused

  return (
    <>
      <Animated.View
        accessibilityElementsHidden={!isSearchFieldVisible}
        pointerEvents={isSearchFieldVisible ? 'auto' : 'none'}
        importantForAccessibility={isSearchFieldVisible ? 'yes' : 'no-hide-descendants'}
        style={[styles.island, createGlassStyles(isLight, RADIUSES.round).container, islandStyle]}
      >
        <GlassSurface isLight={isLight} radius={RADIUSES.round} />
        <SearchBar onFocusChange={handleFocusChange} />
      </Animated.View>
      <SearchIslandCloseSlot
        progress={progress}
        screenWidth={screenWidth}
        isVisible={isCloseVisible}
        onPress={handleCloseSearch}
        openProgress={openProgress}
        tabBarHeight={tabBarHeight}
        closeProgress={closeProgress}
      />
    </>
  )
}

const styles = {
  // zIndex keeps the pill and its upward dropdown above the results scroll.
  island: {
    position: 'absolute' as const,
    zIndex: 20,
  },
}
