import { Ionicons } from '@expo/vector-icons'
import { type SharedValue } from 'react-native-reanimated'
import { OnboardingTarget } from 'features/onboarding'
import { useOpenSearch } from 'features/sermon-search'
import { useTheme } from 'shared/ui/theme'
import { TouchableButton } from 'shared/ui/touchable-button'
import { TAB_ISLAND_SEARCH_SLOT_WIDTH } from '../lib/getIslandStyle'
import { TabSlot } from './TabSlot'

const SEARCH_LABEL = 'Поиск'
// Same onboarding target as the compact search circle: the slot carries it
// while the bar is expanded and the circle takes it over once the bar folds, so
// the id is registered by exactly one affordance at a time.
const SEARCH_TARGET_ID = 'listen.search-toggle'
const MAGNIFIER_SIZE = 32

// Search affordance folded INTO the tab island as a trailing slot (Apple Music
// iPad style). Wide always shows it; compact renders it while the bar is
// expanded and hands the row over to the separate circle when the bar folds.
// The slot morphs with the tabs, fading to zero width and opacity.
export const TabIslandSearchSlot = ({
  isCollapsed,
  isSettledCollapsed,
  isSettledOneLine,
  oneLineProgress,
  progress,
}: {
  isCollapsed: boolean
  isSettledCollapsed: boolean
  isSettledOneLine: boolean
  oneLineProgress: SharedValue<number>
  progress: SharedValue<number>
}) => {
  const { currentTheme } = useTheme()
  const openSearch = useOpenSearch()

  return (
    <TabSlot
      isActive={false}
      progress={progress}
      isCollapsed={isCollapsed}
      oneLineProgress={oneLineProgress}
      isSettledOneLine={isSettledOneLine}
      isSettledCollapsed={isSettledCollapsed}
      expandedWidth={TAB_ISLAND_SEARCH_SLOT_WIDTH}
    >
      <OnboardingTarget style={styles.slot} id={isSettledCollapsed ? undefined : SEARCH_TARGET_ID}>
        <TouchableButton
          onPress={openSearch}
          style={styles.button}
          accessibilityRole='button'
          accessibilityLabel={SEARCH_LABEL}
          // The slot stays mounted while folded (it fades with the island), so
          // assistive tech must not reach the invisible duplicate button.
          accessibilityElementsHidden={isSettledCollapsed}
          importantForAccessibility={isSettledCollapsed ? 'no-hide-descendants' : 'auto'}
        >
          <Ionicons name='search' size={MAGNIFIER_SIZE} color={currentTheme.text} />
        </TouchableButton>
      </OnboardingTarget>
    </TabSlot>
  )
}

const styles = {
  button: {
    alignItems: 'center' as const,
    height: '100%' as const,
    justifyContent: 'center' as const,
    width: TAB_ISLAND_SEARCH_SLOT_WIDTH,
  },
  slot: {
    height: '100%' as const,
    width: TAB_ISLAND_SEARCH_SLOT_WIDTH,
  },
}
