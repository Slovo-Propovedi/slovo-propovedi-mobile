import { useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { SearchBar } from 'features/sermon-search'
import { BAR_MORPH_DURATION_MS, isBarCollapsedAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'

// The search field that replaces the right search circle while search is open.
// Mounted only while search is open: the mount-time progress starts from the
// bar's previous state, so the pill slides out from behind the tab island with
// the same timing as the island morph (and appears in place when already collapsed).
export const SearchIsland = () => {
  const { currentTheme } = useTheme()
  const { width: screenWidth } = useWindowDimensions()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const [isBarCollapsed] = useAtom(isBarCollapsedAtom)
  const progress = useSharedValue(isBarCollapsed ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(1, { duration: BAR_MORPH_DURATION_MS })
  }, [progress])

  const islandStyle = useAnimatedStyle(() => {
    const { radius, ...geometry } = getSearchIslandGeometry({
      barProgress: progress.value,
      screenWidth,
      tabBarHeight,
    })

    return { ...geometry, borderRadius: radius }
  })

  return (
    <Animated.View style={[styles.island, { backgroundColor: currentTheme.surface }, islandStyle]}>
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
