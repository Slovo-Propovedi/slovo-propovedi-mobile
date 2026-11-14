import { View } from 'react-native'
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { OnboardingTarget } from 'features/onboarding'
import { SearchBar } from 'features/sermon-search'
import { TouchableButton } from 'shared/ui/touchable-button'
import { styles } from './SearchIslandMorph.styles'

const SEARCH_LABEL = 'Поиск'
const SEARCH_TARGET_ID = 'listen.search-toggle'

interface SearchIslandContentProps {
  isVisible: boolean
  onFocusChange: (isFocused: boolean) => void
  onOpenSearch: () => void
  openProgress: SharedValue<number>
}

/**
 * Everything inside the morphing frame: the input row and the closed-circle
 * hit target. Both stay mounted; only their content opacity and pointer gates
 * follow the morph progress, so the frame never unmounts or hands off.
 * @param root0 - Component props.
 * @param root0.isVisible - Whether the search field is visible.
 * @param root0.onFocusChange - Called when the input gains/loses focus.
 * @param root0.onOpenSearch - Opens the search from the closed circle.
 * @param root0.openProgress - Search morph progress (0 = circle, 1 = pill).
 */
export const SearchIslandContent = ({
  isVisible,
  onFocusChange,
  onOpenSearch,
  openProgress,
}: SearchIslandContentProps) => {
  const contentStyle = useAnimatedStyle(() => ({ opacity: openProgress.value }))

  return (
    <>
      <Animated.View
        style={[styles.content, contentStyle]}
        accessibilityElementsHidden={!isVisible}
        pointerEvents={isVisible ? 'auto' : 'none'}
        importantForAccessibility={isVisible ? 'yes' : 'no-hide-descendants'}
      >
        <SearchBar onFocusChange={onFocusChange} />
      </Animated.View>
      <View
        style={styles.tapTargetLayer}
        accessibilityElementsHidden={isVisible}
        pointerEvents={isVisible ? 'none' : 'auto'}
        importantForAccessibility={isVisible ? 'no-hide-descendants' : 'yes'}
      >
        <OnboardingTarget id={SEARCH_TARGET_ID} style={styles.tapTargetFill}>
          <TouchableButton
            onPress={onOpenSearch}
            style={styles.tapTargetFill}
            accessibilityLabel={SEARCH_LABEL}
          />
        </OnboardingTarget>
      </View>
    </>
  )
}
