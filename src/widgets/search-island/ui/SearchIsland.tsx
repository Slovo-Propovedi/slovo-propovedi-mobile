import { useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { isSearchOpenAtom, SearchBar } from 'features/sermon-search'
import { BAR_MORPH_DURATION_MS, isBarCollapsedAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'

// The search field that replaces the right search circle while search is open.
// The island stays mounted for the whole listen flow: opening morphs it out of
// the bar (the pill's open-progress follows the same timing as the island
// morph), closing fades it back while the bar expands, and only then is it
// non-interactive. A closed island never takes focus.
export const SearchIsland = () => {
  const { currentTheme } = useTheme()
  const { width: screenWidth } = useWindowDimensions()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const [isBarCollapsed] = useAtom(isBarCollapsedAtom)
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  // Opening search forces the collapsed pill shape, so a surface mounted with
  // search already open starts at the collapsed geometry instead of morphing in.
  const progress = useSharedValue(isBarCollapsed || isSearchOpen ? 1 : 0)
  const openProgress = useSharedValue(isSearchOpen ? 1 : 0)

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

  const islandStyle = useAnimatedStyle(() => {
    const { radius, ...geometry } = getSearchIslandGeometry({
      barProgress: progress.value,
      screenWidth,
      tabBarHeight,
    })

    return { ...geometry, borderRadius: radius, opacity: openProgress.value }
  })

  return (
    <Animated.View
      accessibilityElementsHidden={!isSearchOpen}
      pointerEvents={isSearchOpen ? 'auto' : 'none'}
      importantForAccessibility={isSearchOpen ? 'yes' : 'no-hide-descendants'}
      style={[styles.island, { backgroundColor: currentTheme.surface }, islandStyle]}
    >
      <SearchBar />
    </Animated.View>
  )
}

const styles = {
  // zIndex keeps the pill and its upward dropdown above the results scroll.
  island: {
    position: 'absolute' as const,
    zIndex: 20,
  },
}
