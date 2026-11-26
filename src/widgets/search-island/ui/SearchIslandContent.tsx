import { useAction } from '@reatom/npm-react'
import { Platform, Pressable, View } from 'react-native'
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { OnboardingTarget } from 'features/onboarding'
import { focusSearchInput, SearchBar } from 'features/sermon-search'
import { TouchableButton } from 'shared/ui/touchable-button'
import { styles } from './SearchIslandMorph.styles'

const SEARCH_LABEL = 'Поиск'
const SEARCH_TARGET_ID = 'listen.search-toggle'
// Content and closed circle are visibility-gated together, so they share the
// two a11y values. The focus surface differs: it is a bare hit target, so when
// closed it stays 'auto' instead of claiming to be an important layer.
const A11Y_IMPORTANT = 'yes'
const A11Y_HIDDEN = 'no-hide-descendants'
// The focus surface carries identity only for tests: it is not an accessible
// control (the input is), so text/role queries genuinely do not apply.
export const SEARCH_FOCUS_SURFACE_TEST_ID = 'search-focus-surface'

/**
 * Everything inside the morphing frame: the input row and the closed-circle
 * hit target. Both stay mounted; only their content opacity and pointer gates
 * follow the morph progress, so the frame never unmounts or hands off.
 * @param root0 - Component props.
 * @param root0.isOnboardingTargetEnabled - Whether the circle carries the onboarding target.
 * @param root0.isVisible - Whether the search field is visible.
 * @param root0.onFocusChange - Called when the input gains/loses focus.
 * @param root0.onOpenSearch - Opens the search route from the closed circle.
 * @param root0.openProgress - Search morph progress (0 = circle, 1 = pill).
 */
export const SearchIslandContent = ({
  isOnboardingTargetEnabled = true,
  isVisible,
  onFocusChange,
  onOpenSearch,
  openProgress,
}: {
  isOnboardingTargetEnabled?: boolean
  isVisible: boolean
  onFocusChange: (isFocused: boolean) => void
  onOpenSearch: () => void
  openProgress: SharedValue<number>
}) => {
  const requestFocus = useAction(focusSearchInput)
  const contentStyle = useAnimatedStyle(() => ({ opacity: openProgress.value }))

  return (
    <>
      {/* The open pill is one big focus target. This transparent layer sits
          under the content, so taps in the row's paddings reach it while the
          input, mic and clear button stay hittable as later siblings. It is
          not a button: the input itself is the control. */}
      <Pressable
        tabIndex={-1}
        onPress={requestFocus}
        style={styles.tapTargetLayer}
        testID={SEARCH_FOCUS_SURFACE_TEST_ID}
        accessibilityElementsHidden={isVisible}
        pointerEvents={isVisible ? 'auto' : 'none'}
        importantForAccessibility={isVisible ? A11Y_HIDDEN : 'auto'}
        // Web: a pointerdown on this layer would blur the focused input before
        // the click lands, retracting the island for a frame. Cancelling the
        // press keeps focus; the click still fires onPress (a no-op refocus).
        onPointerDown={event => {
          if (Platform.OS === 'web') event.preventDefault()
        }}
      />
      <Animated.View
        style={[styles.content, contentStyle]}
        accessibilityElementsHidden={!isVisible}
        pointerEvents={isVisible ? 'box-none' : 'none'}
        importantForAccessibility={isVisible ? A11Y_IMPORTANT : A11Y_HIDDEN}
      >
        <SearchBar onFocusChange={onFocusChange} />
      </Animated.View>
      <View
        style={styles.tapTargetLayer}
        accessibilityElementsHidden={isVisible}
        pointerEvents={isVisible ? 'none' : 'auto'}
        importantForAccessibility={isVisible ? A11Y_HIDDEN : A11Y_IMPORTANT}
      >
        <OnboardingTarget
          style={styles.tapTargetFill}
          id={isOnboardingTargetEnabled ? SEARCH_TARGET_ID : undefined}
        >
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
