import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { Keyboard, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { isTabIslandCollapsedAtom } from 'widgets/tab-bar/@x/morph'
import { closeSearch, SearchBar, useIsSearchFieldVisible } from 'features/sermon-search'
import { isSearchFieldVisibleAtom } from 'features/sermon-search/@x/barMorph'
import { useAtomMorphProgress } from 'shared/lib/hooks/useAtomMorphProgress'
import { createGlassStyles, GlassSurface } from 'shared/ui'
import { BAR_MORPH_DURATION_MS, tabBarHeightAtom, useKeyboardLiftStyle } from 'shared/ui/layout'
import { RADIUSES, useTheme } from 'shared/ui/theme'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'
import { getSearchIslandOpacity } from '../lib/getSearchIslandOpacity'
import { SearchIslandCloseSlot } from './SearchIslandCloseSlot'

// The search field that replaces the right search circle while the field is
// visible. The island stays mounted for the whole tab shell: opening grows it
// out of the search chip into its row slot and collapsing shrinks it back onto
// the chip, both driven by one progress using the island's morph duration. The
// pill frame never fades — geometry makes it disappear — and while hidden it
// stays non-interactive. A hidden island never takes focus.
//
// While the input is focused, a separate ✕ circle appears to the right and the
// pill yields a circle + gap of room to it (both animate with the same morph
// duration, so the row reads as [pill][✕] the whole way).
export const SearchIsland = () => {
  const { isLight } = useTheme()
  const { width: screenWidth } = useWindowDimensions()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const isSearchFieldVisible = useIsSearchFieldVisible()
  const [isFocused, setIsFocused] = useState(false)
  const closeSearchAction = useAction(closeSearch)
  // Both morphs start in their atom subscriptions (before this component
  // renders), so the pill and the tab island stay in sync frame by frame.
  const progress = useAtomMorphProgress(isTabIslandCollapsedAtom, BAR_MORPH_DURATION_MS)
  // The pill's own geometry progress: 0 = collapsed onto the search chip,
  // 1 = full row slot. Same duration and same visibility flip as the island.
  const openProgress = useAtomMorphProgress(isSearchFieldVisibleAtom, BAR_MORPH_DURATION_MS)
  // Seeded from the focus state so a bar re-rendered while already focused
  // starts with the close slot reserved instead of snapping on the next frame.
  const closeProgress = useSharedValue(isFocused ? 1 : 0)

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

  const keyboardLiftStyle = useKeyboardLiftStyle()

  const islandStyle = useAnimatedStyle(() => {
    const { radius, ...geometry } = getSearchIslandGeometry({
      barProgress: progress.value,
      closeProgress: closeProgress.value,
      openProgress: openProgress.value,
      screenWidth,
      tabBarHeight,
    })

    return {
      ...geometry,
      borderRadius: radius,
      opacity: getSearchIslandOpacity(openProgress.value, isSearchFieldVisible),
    }
  })

  const isCloseVisible = isSearchFieldVisible && isFocused

  return (
    <Animated.View pointerEvents='box-none' style={[styles.liftLayer, keyboardLiftStyle]}>
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
    </Animated.View>
  )
}

const styles = {
  // zIndex keeps the pill and its upward dropdown above the results scroll.
  island: {
    position: 'absolute' as const,
    zIndex: 20,
  },
  // Full-screen touch pass-through layer that carries the keyboard lift for the
  // pill and its close circle; the children keep their row geometry inside it.
  liftLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    top: 0,
    zIndex: 20,
  },
}
