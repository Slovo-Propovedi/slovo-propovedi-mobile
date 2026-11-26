import { useWindowDimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { OnboardingTarget } from 'features/onboarding'
import { GlassIsland } from 'shared/ui'
import { useBarBottomPadding, useIsWideLayout, useKeyboardLiftStyle } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { getVisibleTabRoutes, SEARCH_ROUTE_NAME } from '../lib/getVisibleTabRoutes'
import { type TabBarProps } from '../lib/tabBarTypes'
import { useActiveTabRouteKey } from '../lib/useActiveTabRouteKey'
import { useRowInsetStyle } from '../lib/useRowInsetStyle'
import { useTabBarMeasurement } from '../lib/useTabBarMeasurement'
import { useTabIslandMorph } from '../lib/useTabIslandMorph'
import { getFloatingContainerStyle, getIslandsRowStyle } from './getFloatingContainerStyle'
import { styles } from './styles'
import { TabBarSearchCircle } from './TabBarSearchCircle'
import { TabButton } from './TabButton'
import { TabIslandSearchSlot } from './TabIslandSearchSlot'
import { TabSlot } from './TabSlot'
import { useTabPress } from './useTabPress'

export const CustomTabBar = ({
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
  const isSearchFocused = state.routes[state.index]?.name === SEARCH_ROUTE_NAME
  const { handleTabPress, isTabAvailable } = useTabPress({
    emitter,
    isSearchFocused,
    navigateToTab,
  })
  const { width: windowWidth } = useWindowDimensions()
  const isWide = useIsWideLayout()
  const { onLayout, rowWidth } = useTabBarMeasurement()
  const activeRouteKey = useActiveTabRouteKey(state.routes, state.index)
  const visibleRoutes = getVisibleTabRoutes(state.routes)
  const {
    contentStyle,
    expandedTabWidth,
    isCollapsed,
    isFocused,
    islandStyle,
    oneLineProgress,
    progress,
    restingContentStyle,
    restingIslandStyle,
    settledCollapsed,
    settledOneLine,
  } = useTabIslandMorph({
    hideSearch,
    isForceExpanded: isWide,
    routeCount: visibleRoutes.length,
    rowWidth,
    windowWidth,
  })
  const bottomPadding = useBarBottomPadding()
  const keyboardLiftStyle = useKeyboardLiftStyle()
  const { insetStyle, restingInsetStyle } = useRowInsetStyle(isWide)

  return (
    <Animated.View
      pointerEvents='box-none'
      style={getFloatingContainerStyle(isWide, insets.top, keyboardLiftStyle)}
    >
      <Animated.View
        onLayout={onLayout}
        pointerEvents='box-none'
        style={getIslandsRowStyle(isWide, bottomPadding, { insetStyle, restingInsetStyle })}
      >
        {/* Pass-through host: drags on its padding/gaps reach the list; inert while focused. */}
        <GlassIsland
          isLight={isLight}
          pointerEvents={isFocused ? 'none' : 'box-none'}
          animatedStyle={[islandStyle, restingIslandStyle]}
          hostStyle={[styles.floatingIsland, isWide && styles.floatingIslandElevated]}
        >
          <Animated.View style={[styles.islandContent, contentStyle, restingContentStyle]}>
            {visibleRoutes.map(route => {
              const isActive = route.key === activeRouteKey

              return (
                <TabSlot
                  key={route.key}
                  isActive={isActive}
                  progress={progress}
                  isCollapsed={isCollapsed}
                  expandedWidth={expandedTabWidth}
                  oneLineProgress={oneLineProgress}
                  isSettledOneLine={settledOneLine}
                  isSettledCollapsed={settledCollapsed}
                >
                  <OnboardingTarget id={`tab.${route.name}`} style={styles.tabButton}>
                    <TabButton
                      isActive={isActive}
                      routeKey={route.key}
                      routeName={route.name}
                      collapseProgress={progress}
                      oneLineProgress={oneLineProgress}
                      isBarVisuallyCollapsed={isCollapsed}
                      isDisabled={!isTabAvailable(route.name)}
                      onPress={() => handleTabPress(route, isActive)}
                    />
                  </OnboardingTarget>
                </TabSlot>
              )
            })}
            {!hideSearch && (
              <TabIslandSearchSlot
                progress={progress}
                isCollapsed={isCollapsed}
                isSettledOneLine={settledOneLine}
                oneLineProgress={oneLineProgress}
                isSettledCollapsed={settledCollapsed}
              />
            )}
          </Animated.View>
        </GlassIsland>
      </Animated.View>
      {!hideSearch && !isWide && <TabBarSearchCircle />}
    </Animated.View>
  )
}
