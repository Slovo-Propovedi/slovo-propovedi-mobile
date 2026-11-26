import { type ReactNode } from 'react'
import { type StyleProp, type ViewStyle } from 'react-native'
import { type AnimatedStyle } from 'react-native-reanimated'
import { GlassIsland } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { styles } from './SearchIslandMorph.styles'

/**
 * Glass host of the search morph: it only positions the interactive children.
 * Compact fades it away while the search button lives inside the tab island, but
 * it stays mounted so the field morph keeps its single node.
 * @param root0 - Component props.
 * @param root0.animatedStyle - Animated and resting frame geometry.
 * @param root0.children - Magnifier and field content.
 * @param root0.isFoldedAway - Whether the tab island owns the search affordance.
 */
export const SearchIslandFrame = ({
  animatedStyle,
  children,
  isFoldedAway,
}: {
  animatedStyle: StyleProp<AnimatedStyle<ViewStyle>>
  children: ReactNode
  isFoldedAway: boolean
}) => {
  const { isLight } = useTheme()

  return (
    <GlassIsland
      isLight={isLight}
      hostStyle={styles.container}
      animatedStyle={animatedStyle}
      accessibilityElementsHidden={isFoldedAway}
      pointerEvents={isFoldedAway ? 'none' : 'box-none'}
      importantForAccessibility={isFoldedAway ? 'no-hide-descendants' : 'auto'}
    >
      {children}
    </GlassIsland>
  )
}
