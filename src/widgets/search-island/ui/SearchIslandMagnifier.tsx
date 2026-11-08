import { Ionicons } from '@expo/vector-icons'
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useTheme } from 'shared/ui/theme'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'
import { styles } from './SearchIslandMorph.styles'

// The magnifier is always mounted as the morph's first child. Its box shrinks
// from the circle size to the pill size while its left inset travels with the
// animating container edge, so the icon is the continuous visual anchor between
// the two states instead of a crossfade.
const ICON_BASE_SIZE = 28

interface SearchIslandMagnifierProps {
  barProgress: SharedValue<number>
  openProgress: SharedValue<number>
  screenWidth: number
  tabBarHeight: number
}

/**
 * The always-visible search glyph of the morphing search frame.
 * @param root0 - Component props.
 * @param root0.barProgress - Bar morph progress (0 = expanded, 1 = collapsed).
 * @param root0.openProgress - Search morph progress (0 = circle, 1 = pill).
 * @param root0.screenWidth - Current viewport width.
 * @param root0.tabBarHeight - Measured height of the floating tab row.
 */
export const SearchIslandMagnifier = ({
  barProgress,
  openProgress,
  screenWidth,
  tabBarHeight,
}: SearchIslandMagnifierProps) => {
  const { currentTheme } = useTheme()

  const style = useAnimatedStyle(() => {
    const { iconSize } = getSearchIslandGeometry({
      barProgress: barProgress.value,
      openProgress: openProgress.value,
      screenWidth,
      tabBarHeight,
    })

    return {
      height: iconSize,
      transform: [{ scale: iconSize / ICON_BASE_SIZE }],
      width: iconSize,
    }
  })

  return (
    <Animated.View pointerEvents='none' style={[styles.magnifier, style]}>
      <Ionicons name='search' size={ICON_BASE_SIZE} color={currentTheme.text} />
    </Animated.View>
  )
}
