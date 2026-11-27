import { type SharedValue } from 'react-native-reanimated'
import { OnboardingTarget } from 'features/onboarding'
import { styles } from './styles'
import { TabButton } from './TabButton'
import { TabSlot } from './TabSlot'

// One regular tab: its morphed slot plus the in-slot button and onboarding
// target. Kept separate from the bar so the bar reads as layout composition.
export const TabBarTab = ({
  expandedWidth,
  isActiveSlot,
  isBarCollapsed,
  isDisabled,
  isHighlighted,
  isSettledCollapsed,
  isSettledOneLine,
  isWideLayout,
  oneLineProgress,
  onPress,
  progress,
  routeKey,
  routeName,
}: {
  expandedWidth: number
  isActiveSlot: boolean
  isBarCollapsed: boolean
  isDisabled: boolean
  /** Search is the active destination, so the fallback circle tab is not. */
  isHighlighted: boolean
  isSettledCollapsed: boolean
  isSettledOneLine: boolean
  /** Wide layout: the island and its slots read the slim constant height. */
  isWideLayout: boolean
  oneLineProgress: SharedValue<number>
  onPress: () => void
  progress: SharedValue<number>
  routeKey: string
  routeName: string
}) => (
  <TabSlot
    progress={progress}
    isActive={isActiveSlot}
    isWideLayout={isWideLayout}
    isCollapsed={isBarCollapsed}
    expandedWidth={expandedWidth}
    oneLineProgress={oneLineProgress}
    isSettledOneLine={isSettledOneLine}
    isSettledCollapsed={isSettledCollapsed}
  >
    <OnboardingTarget id={`tab.${routeName}`} style={styles.tabButton}>
      <TabButton
        onPress={onPress}
        routeKey={routeKey}
        routeName={routeName}
        isDisabled={isDisabled}
        isActive={isHighlighted}
        isWideLayout={isWideLayout}
        collapseProgress={progress}
        oneLineProgress={oneLineProgress}
        isBarVisuallyCollapsed={isBarCollapsed}
      />
    </OnboardingTarget>
  </TabSlot>
)
