import { Ionicons } from '@expo/vector-icons'
import { type SharedValue } from 'react-native-reanimated'
import { OnboardingTarget } from 'features/onboarding'
import { CircleButton } from './CircleButton'

const SEARCH_ICON_SIZE = 24
const SEARCH_LABEL = 'Поиск'
const SEARCH_TARGET_ID = 'listen.search-toggle'

/**
 * Search chip of the floating tab row. Split from `CustomTabBar` so the bar
 * file stays within the line budget.
 * @param root0 - Chip props.
 * @param root0.color - Tint of the search glyph.
 * @param root0.hasShadow - Whether the chip paints its own glass shadow.
 * @param root0.onPress - Opens the search field.
 * @param root0.progress - Bar morph progress; sizes the chip with the island.
 */
export const TabBarSearchButton = ({
  color,
  hasShadow,
  onPress,
  progress,
}: {
  color: string
  hasShadow: boolean
  onPress: () => void
  progress: SharedValue<number>
}) => (
  <OnboardingTarget id={SEARCH_TARGET_ID}>
    <CircleButton
      onPress={onPress}
      progress={progress}
      hasShadow={hasShadow}
      accessibilityLabel={SEARCH_LABEL}
    >
      <Ionicons name='search' color={color} size={SEARCH_ICON_SIZE} />
    </CircleButton>
  </OnboardingTarget>
)
