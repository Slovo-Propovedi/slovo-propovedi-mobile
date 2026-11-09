import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { GlassSurface } from 'shared/ui'
import { RADIUSES, useTheme } from 'shared/ui/theme'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'
import { SearchIslandCloseButton } from './SearchIslandCloseButton'

interface SearchIslandCloseSlotProps {
  closeProgress: SharedValue<number>
  /** A bar morph is resizing the circle: drop live glass for the static tint. */
  degraded: boolean
  isVisible: boolean
  onPress: () => void
  openProgress: SharedValue<number>
  progress: SharedValue<number>
  screenWidth: number
  tabBarHeight: number
}

/**
 * The circular ✕ that appears beside the pill while the input is focused.
 * Its opacity and scale follow the shared close progress, so appearance and
 * disappearance use the same morph duration as the pill's width. It is content
 * of the same morph component, never a second shadow carrier: the search frame
 * owns the row's only boxShadow.
 * @param root0 - Component props.
 * @param root0.closeProgress - 0 = hidden, 1 = fully shown.
 * @param root0.degraded - Renders the static glass tint while the bar morphs.
 * @param root0.isVisible - Gates pointer events and accessibility only.
 * @param root0.onPress - Closes the search session.
 * @param root0.openProgress - The island's open/close progress.
 * @param root0.progress - The bar collapse progress.
 * @param root0.screenWidth - Current viewport width.
 * @param root0.tabBarHeight - Measured height of the floating tab row.
 */
export const SearchIslandCloseSlot = ({
  closeProgress,
  degraded,
  isVisible,
  onPress,
  openProgress,
  progress,
  screenWidth,
  tabBarHeight,
}: SearchIslandCloseSlotProps) => {
  const { isLight } = useTheme()

  const style = useAnimatedStyle(() => {
    const { bottom, closeRight, height } = getSearchIslandGeometry({
      barProgress: progress.value,
      openProgress: openProgress.value,
      screenWidth,
      tabBarHeight,
    })

    return {
      borderRadius: height / 2,
      bottom,
      height,
      opacity: openProgress.value * closeProgress.value,
      right: closeRight,
      transform: [{ scale: 0.8 + 0.2 * closeProgress.value }],
      width: height,
    }
  })

  return (
    <Animated.View
      style={[styles.closeCircle, style]}
      accessibilityElementsHidden={!isVisible}
      pointerEvents={isVisible ? 'auto' : 'none'}
      importantForAccessibility={isVisible ? 'yes' : 'no-hide-descendants'}
    >
      <GlassSurface isLight={isLight} degraded={degraded} radius={RADIUSES.round} />
      <SearchIslandCloseButton onPress={onPress} />
    </Animated.View>
  )
}

const styles = {
  closeCircle: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    position: 'absolute' as const,
    zIndex: 20,
  },
}
