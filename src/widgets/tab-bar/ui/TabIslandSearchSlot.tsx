import { Ionicons } from '@expo/vector-icons'
import { OnboardingTarget } from 'features/onboarding'
import { useOpenSearch } from 'features/sermon-search'
import { useTheme } from 'shared/ui/theme'
import { TouchableButton } from 'shared/ui/touchable-button'
import { TAB_ISLAND_SEARCH_SLOT_WIDTH } from '../lib/getIslandStyle'

const SEARCH_LABEL = 'Поиск'
// Same onboarding target as the compact search circle: only one of the two
// affordances is mounted at a time, so the id never collides at runtime.
const SEARCH_TARGET_ID = 'listen.search-toggle'
const MAGNIFIER_SIZE = 32

// Wide-layout search affordance: the search circle folded INTO the tab island as
// a trailing slot (Apple Music iPad style). The compact layout keeps the
// separate morphing circle island instead.
export const TabIslandSearchSlot = () => {
  const { currentTheme } = useTheme()
  const openSearch = useOpenSearch()

  return (
    <OnboardingTarget style={styles.slot} id={SEARCH_TARGET_ID}>
      <TouchableButton
        onPress={openSearch}
        style={styles.button}
        accessibilityRole='button'
        accessibilityLabel={SEARCH_LABEL}
      >
        <Ionicons name='search' size={MAGNIFIER_SIZE} color={currentTheme.text} />
      </TouchableButton>
    </OnboardingTarget>
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
