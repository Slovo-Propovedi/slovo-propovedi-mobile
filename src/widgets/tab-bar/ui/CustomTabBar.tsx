import Animated from 'react-native-reanimated'
import { GlassIsland } from 'shared/ui'
import { useIsWideLayout, useLayoutBaseWidth } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { getInstantTabNavigation } from '../lib/getInstantTabNavigation'
import { getVisibleTabRoutes, SEARCH_ROUTE_NAME } from '../lib/getVisibleTabRoutes'
import { type TabBarProps } from '../lib/tabBarTypes'
import { useActiveTabRouteKey } from '../lib/useActiveTabRouteKey'
import { useCapsuleTravel } from '../lib/useCapsuleTravel'
import { useFloatingShiftStyles } from '../lib/useFloatingShiftStyles'
import { useRowInsetStyle } from '../lib/useRowInsetStyle'
import { useTabBarMeasurement } from '../lib/useTabBarMeasurement'
import { useTabIslandMorph } from '../lib/useTabIslandMorph'
import { getFloatingContainerStyle, getIslandsRowStyle } from './getFloatingContainerStyle'
import { styles } from './styles'
import { TabBarSearchButton } from './TabBarSearchButton'
import { TabIslandContent } from './TabIslandContent'
import { useTabPress } from './useTabPress'

export const CustomTabBar = ({
  descriptors,
  emitter,
  hideSearch = false,
  insets,
  navigateToTab,
  state,
}: {
  /** Admin tab layouts have no global search. */
  hideSearch?: boolean
} & TabBarProps) => {
  const { isLight } = useTheme()
  const focusedRoute = state.routes[state.index]
  const isSearchFocused = focusedRoute?.name === SEARCH_ROUTE_NAME
  // Orientation-independent base: the island is a portrait-width canvas in both
  // orientations, so a rotation re-centres it (native flex) without resizing it.
  const layoutBaseWidth = useLayoutBaseWidth()
  const isWide = useIsWideLayout()
  const { bottomPadding, onLayout } = useTabBarMeasurement()
  const activeRouteKey = useActiveTabRouteKey(state.routes, state.index)
  const visibleRoutes = getVisibleTabRoutes(state.routes)
  const morph = useTabIslandMorph({
    baseWidth: layoutBaseWidth,
    hideSearch,
    isForceExpanded: isWide,
    routeCount: visibleRoutes.length,
  })
  const {
    contentStyle,
    expandedSearchWidth,
    expandedTabWidth,
    isCollapsed,
    isFocused,
    islandStyle,
    oneLineProgress,
    progress,
    restingContentStyle,
    restingIslandStyle,
  } = morph
  const { motion, motionFor, requestTravel, resting } = useCapsuleTravel({
    activeRouteKey,
    hideSearch,
    isExpanded: !isCollapsed,
    isSearchFocused,
    searchWidth: expandedSearchWidth,
    tabRouteKeys: visibleRoutes.map(route => route.key),
    tabWidth: expandedTabWidth,
  })
  // The press path starts the capsule on the tap tick; the travel hook's route
  // effect then reconciles with the same destination (no double start).
  const { handleTabPress, isTabAvailable } = useTabPress({
    emitter,
    isSearchFocused,
    navigateToTab: getInstantTabNavigation({ descriptors, fallback: navigateToTab, state }),
    onTabTravel: requestTravel,
  })
  const { keyboardLiftStyle, shiftStyle } = useFloatingShiftStyles(insets.top)
  const rowInsets = useRowInsetStyle(isWide)

  return (
    <Animated.View
      pointerEvents='box-none'
      style={getFloatingContainerStyle(isWide, insets.top, keyboardLiftStyle, shiftStyle)}
    >
      <Animated.View
        onLayout={onLayout}
        pointerEvents='box-none'
        style={getIslandsRowStyle(isWide, bottomPadding, layoutBaseWidth, rowInsets)}
      >
        {/* Pass-through host: drags on its padding/gaps reach the list; inert while focused. */}
        <GlassIsland
          isLight={isLight}
          pointerEvents={isFocused ? 'none' : 'box-none'}
          animatedStyle={[islandStyle, restingIslandStyle]}
          hostStyle={[styles.floatingIsland, isWide && styles.floatingIslandElevated]}
        >
          <TabIslandContent
            isWide={isWide}
            capsule={motion}
            progress={progress}
            motionFor={motionFor}
            hideSearch={hideSearch}
            restingCapsule={resting}
            isCollapsed={isCollapsed}
            contentStyle={contentStyle}
            visibleRoutes={visibleRoutes}
            activeRouteKey={activeRouteKey}
            handleTabPress={handleTabPress}
            isTabAvailable={isTabAvailable}
            isSearchFocused={isSearchFocused}
            oneLineProgress={oneLineProgress}
            expandedTabWidth={expandedTabWidth}
            settledOneLine={morph.settledOneLine}
            settledCollapsed={morph.settledCollapsed}
            expandedSearchWidth={expandedSearchWidth}
            restingContentStyle={restingContentStyle}
          />
        </GlassIsland>
      </Animated.View>
      {!hideSearch && !isWide && (
        <TabBarSearchButton
          morph={morph}
          isActive={isSearchFocused}
          routeCount={visibleRoutes.length}
          capsuleMotion={motionFor(visibleRoutes.length)}
        />
      )}
    </Animated.View>
  )
}
