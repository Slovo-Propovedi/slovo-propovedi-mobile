import { useWindowDimensions } from 'react-native'
import Animated from 'react-native-reanimated'
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
import { TabBarTab } from './TabBarTab'
import { TabIslandSearchSlot } from './TabIslandSearchSlot'
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
  const focusedRoute = state.routes[state.index]
  const isSearchFocused = focusedRoute?.name === SEARCH_ROUTE_NAME
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
    expandedSearchWidth,
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
              // The fallback tab owns the collapsed circle while search is
              // focused, but search is the active destination: the tab is not
              // highlighted and search carries the active capsule.
              const isActiveSlot = route.key === activeRouteKey

              return (
                <TabBarTab
                  key={route.key}
                  progress={progress}
                  routeKey={route.key}
                  isWideLayout={isWide}
                  routeName={route.name}
                  isActiveSlot={isActiveSlot}
                  isBarCollapsed={isCollapsed}
                  expandedWidth={expandedTabWidth}
                  isSettledOneLine={settledOneLine}
                  oneLineProgress={oneLineProgress}
                  isSettledCollapsed={settledCollapsed}
                  isDisabled={!isTabAvailable(route.name)}
                  isHighlighted={isActiveSlot && !isSearchFocused}
                  onPress={() => handleTabPress(route, isActiveSlot)}
                />
              )
            })}
            {!hideSearch && (
              <TabIslandSearchSlot
                progress={progress}
                isWideLayout={isWide}
                isCollapsed={isCollapsed}
                isActive={isSearchFocused}
                isSettledOneLine={settledOneLine}
                oneLineProgress={oneLineProgress}
                expandedWidth={expandedSearchWidth}
                isSettledCollapsed={settledCollapsed}
              />
            )}
          </Animated.View>
        </GlassIsland>
      </Animated.View>
      {!hideSearch && !isWide && <TabBarSearchCircle isActive={isSearchFocused} />}
    </Animated.View>
  )
}
