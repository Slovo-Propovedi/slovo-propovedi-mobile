import { useAtom } from '@reatom/npm-react'
import { useWindowDimensions, View } from 'react-native'
import Animated, { type SharedValue } from 'react-native-reanimated'
import { OnboardingTarget } from 'features/onboarding'
import { useOpenSearch } from 'features/sermon-search'
import { GlassSurface } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { RADIUSES, useTheme } from 'shared/ui/theme'
import { type SlotCapsuleMotion } from '../lib/capsuleTravel'
import { SEARCH_ROUTE_NAME } from '../lib/getVisibleTabRoutes'
import { useSearchSeparation } from '../lib/useSearchSeparation'
import { ActiveTabCapsule } from './ActiveTabCapsule'
import { searchButtonStyles } from './searchButtonStyles'
import { styles } from './styles'
import { TabButton } from './TabButton'

// Same onboarding target the wide slot registers: exactly one compact search
// affordance exists now (the moving button), so the id is never duplicated.
const SEARCH_TARGET_ID = 'listen.search-toggle'
const SEARCH_LABEL = 'Поиск'

interface SearchButtonMorph {
  expandedSearchWidth: number
  expandedTabWidth: number
  /** Live collapse flag: gates the collapsed-tap haptic. */
  isCollapsed: boolean
  /** Height axis of the bar (the button height follows the island height). */
  oneLineProgress: SharedValue<number>
  /** Shape axis: doubles as the separation of the button from the island. */
  progress: SharedValue<number>
}

// The compact search affordance. One element travels between the in-island
// search slot and the separate circle: as the tab island folds, the button
// TEARS OFF (rightwards/shrinking while its own glass fades in over the island's
// glass); expanding glues it back (the glass fades out as it merges). Re-parented
// to the row layer so it can leave the island's clipping content.
export const TabBarSearchButton = ({
  capsuleMotion,
  isActive,
  morph,
  routeCount,
}: {
  /** Traveling-capsule geometry for this slot's label/icon reaction. */
  capsuleMotion?: SlotCapsuleMotion
  /** Search owns the active route: the collapsed circle paints the highlight. */
  isActive: boolean
  /** Live tab-island morph: its shape axis doubles as the separation. */
  morph: SearchButtonMorph
  /** Visible routed tabs before the search slot. */
  routeCount: number
}) => {
  const { expandedSearchWidth, expandedTabWidth, isCollapsed, oneLineProgress, progress } = morph
  const { width: screenWidth } = useWindowDimensions()
  const { isLight } = useTheme()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const openSearch = useOpenSearch()
  const { buttonStyle, capsuleStyle, glassStyle } = useSearchSeparation({
    expandedSearchWidth,
    expandedTabWidth,
    oneLineProgress,
    routeCount,
    screenWidth,
    separation: progress,
    tabBarHeight,
  })

  return (
    <Animated.View style={[searchButtonStyles.host, buttonStyle]}>
      {/* Own glass: invisible on the island, fully opaque at the circle. */}
      <Animated.View pointerEvents='none' style={[searchButtonStyles.glass, glassStyle]}>
        <GlassSurface isLight={isLight} radius={RADIUSES.round} />
      </Animated.View>
      {isActive && <ActiveTabCapsule style={[searchButtonStyles.capsule, capsuleStyle]} />}
      <View style={searchButtonStyles.content}>
        <OnboardingTarget id={SEARCH_TARGET_ID} style={styles.tabButton}>
          <TabButton
            isSearchSlot
            isActive={isActive}
            onPress={openSearch}
            isWideLayout={false}
            collapseProgress={progress}
            routeKey={SEARCH_ROUTE_NAME}
            capsuleMotion={capsuleMotion}
            routeName={SEARCH_ROUTE_NAME}
            accessibilityLabel={SEARCH_LABEL}
            oneLineProgress={oneLineProgress}
            isBarVisuallyCollapsed={isCollapsed}
          />
        </OnboardingTarget>
      </View>
    </Animated.View>
  )
}
