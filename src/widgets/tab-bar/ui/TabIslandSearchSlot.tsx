import { View } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'
import { OnboardingTarget } from 'features/onboarding'
import { useOpenSearch } from 'features/sermon-search'
import { SEARCH_ROUTE_NAME } from '../lib/getVisibleTabRoutes'
import { styles } from './styles'
import { TabButton } from './TabButton'
import { TabSlot } from './TabSlot'

// Same onboarding target as the compact search circle: the slot carries it
// while the bar is expanded and the circle takes it over once the bar folds, so
// the id is registered by exactly one affordance at a time.
const SEARCH_TARGET_ID = 'listen.search-toggle'
const SEARCH_LABEL = 'Поиск'

// Search affordance folded INTO the tab island as a full-width trailing tab
// (Apple Music iPad style). Wide always shows it; compact renders it while the
// bar is expanded and hands the row over to the separate circle when the bar
// folds. The slot morphs with the tabs and shares their width, icon and label.
export const TabIslandSearchSlot = ({
  expandedWidth,
  isActive,
  isCollapsed,
  isSettledCollapsed,
  isSettledOneLine,
  oneLineProgress,
  progress,
}: {
  expandedWidth: number
  /** The search route is focused: paint the active-tab capsule on the slot. */
  isActive: boolean
  isCollapsed: boolean
  isSettledCollapsed: boolean
  isSettledOneLine: boolean
  oneLineProgress: SharedValue<number>
  progress: SharedValue<number>
}) => {
  const openSearch = useOpenSearch()

  return (
    <TabSlot
      // The search tab never owns the collapsed circle: the folded row gives
      // that circle to the fallback «Слушать» tab and shows search in its own
      // separate circle.
      isActive={false}
      progress={progress}
      isCollapsed={isCollapsed}
      expandedWidth={expandedWidth}
      oneLineProgress={oneLineProgress}
      isSettledOneLine={isSettledOneLine}
      isSettledCollapsed={isSettledCollapsed}
    >
      <View
        style={styles.tabButton}
        // The slot stays mounted while folded (it fades with the island), so
        // assistive tech must not reach the invisible duplicate button.
        accessibilityElementsHidden={isSettledCollapsed}
        importantForAccessibility={isSettledCollapsed ? 'no-hide-descendants' : 'auto'}
      >
        <OnboardingTarget
          style={styles.tabButton}
          id={isSettledCollapsed ? undefined : SEARCH_TARGET_ID}
        >
          <TabButton
            isActive={isActive}
            onPress={openSearch}
            collapseProgress={progress}
            routeKey={SEARCH_ROUTE_NAME}
            routeName={SEARCH_ROUTE_NAME}
            accessibilityLabel={SEARCH_LABEL}
            oneLineProgress={oneLineProgress}
            isBarVisuallyCollapsed={isCollapsed}
          />
        </OnboardingTarget>
      </View>
    </TabSlot>
  )
}
