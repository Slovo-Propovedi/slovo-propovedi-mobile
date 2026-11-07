import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { Keyboard, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { closeSearch, isSearchOpenAtom, SearchBar } from 'features/sermon-search'
import { BAR_MORPH_DURATION_MS, isBarCollapsedAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'
import { SearchIslandCloseSlot } from './SearchIslandCloseSlot'

// The search field that replaces the right search circle while search is open.
// The island stays mounted for the whole listen flow: opening morphs it out of
// the bar (the pill's open-progress follows the same timing as the island
// morph), closing fades it back while the bar expands, and only then is it
// non-interactive. A closed island never takes focus.
//
// While the input is focused, a separate ✕ circle appears to the right and the
// pill yields a circle + gap of room to it (both animate with the same morph
// duration, so the row reads as [pill][✕] the whole way).
export const SearchIsland = () => {
  const { currentTheme } = useTheme()
  const { width: screenWidth } = useWindowDimensions()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const [isBarCollapsed] = useAtom(isBarCollapsedAtom)
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  const [isFocused, setIsFocused] = useState(false)
  const closeSearchAction = useAction(closeSearch)
  // Opening search forces the collapsed pill shape, so a surface mounted with
  // search already open starts at the collapsed geometry instead of morphing in.
  const progress = useSharedValue(isBarCollapsed || isSearchOpen ? 1 : 0)
  const openProgress = useSharedValue(isSearchOpen ? 1 : 0)
  // Seeded from the focus state so a bar re-rendered while already focused
  // starts with the close slot reserved instead of snapping on the next frame.
  const closeProgress = useSharedValue(isFocused ? 1 : 0)

  useEffect(() => {
    if (isSearchOpen) {
      progress.value = isBarCollapsed ? 1 : 0
      progress.value = withTiming(1, { duration: BAR_MORPH_DURATION_MS })
      openProgress.value = withTiming(1, { duration: BAR_MORPH_DURATION_MS })
      return
    }

    progress.value = withTiming(isBarCollapsed ? 1 : 0, { duration: BAR_MORPH_DURATION_MS })
    openProgress.value = withTiming(0, { duration: BAR_MORPH_DURATION_MS })
  }, [isBarCollapsed, isSearchOpen, openProgress, progress])

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

  const isCloseVisible = isSearchOpen && isFocused

  return (
    <>
      <Animated.View
        accessibilityElementsHidden={!isSearchOpen}
        pointerEvents={isSearchOpen ? 'auto' : 'none'}
        importantForAccessibility={isSearchOpen ? 'yes' : 'no-hide-descendants'}
        style={[styles.island, { backgroundColor: currentTheme.surface }, islandStyle]}
      >
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
