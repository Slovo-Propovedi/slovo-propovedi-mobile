import { useAction } from '@reatom/npm-react'
import { type Tabs } from 'expo-router'
import { useState } from 'react'
import { useWindowDimensions, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SearchIslandMorph } from 'widgets/search-island/@x/morph'
import { OnboardingTarget } from 'features/onboarding'
import { createGlassStyles, GlassSurface } from 'shared/ui'
import {
  BAR_BOTTOM_INSET_MIN,
  BAR_ROW_MIN_HEIGHT,
  setTabBarHeight,
  useKeyboardLiftStyle,
} from 'shared/ui/layout'
import { RADIUSES, useTheme } from 'shared/ui/theme'
import { useTabIslandMorph } from '../lib/useTabIslandMorph'
import { styles } from './styles'
import { TabButton } from './TabButton'
import { TabSlot } from './TabSlot'
import { useTabPress } from './useTabPress'

// На 3-кнопочной навигации берётся высота навбара из safe-area insets (Issue #56);
// без неё острова сидят низко с небольшим нижним зазором.
const HIDDEN_TAB_ROUTE_NAMES = new Set(['study'])

interface CustomTabBarProps extends TabBarProps {
  /** Admin tab layouts have no global search. */
  hideSearch?: boolean
}

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0]

export const CustomTabBar = ({
  emitter,
  hideSearch = false,
  navigateToTab,
  state,
}: CustomTabBarProps) => {
  const setMeasuredTabBarHeight = useAction(setTabBarHeight)
  const { bottom } = useSafeAreaInsets()
  const { isLight } = useTheme()
  const { handleTabPress, isTabAvailable } = useTabPress({ emitter, navigateToTab })
  const { width: windowWidth } = useWindowDimensions()
  const [rowWidth, setRowWidth] = useState(0)
  const visibleRoutes = state.routes.filter(route => !HIDDEN_TAB_ROUTE_NAMES.has(route.name))
  const activeRouteKey = state.routes[state.index]?.key
  const { contentStyle, expandedTabWidth, isCollapsed, islandStyle, progress } = useTabIslandMorph({
    hideSearch,
    routeCount: visibleRoutes.length,
    rowWidth,
    windowWidth,
  })
  const bottomPadding = Math.max(bottom, BAR_BOTTOM_INSET_MIN)
  const glass = createGlassStyles(isLight, RADIUSES.round)
  const keyboardLiftStyle = useKeyboardLiftStyle()

  return (
    <Animated.View pointerEvents='box-none' style={[styles.floatingContainer, keyboardLiftStyle]}>
      <View
        pointerEvents='box-none'
        style={[
          styles.islandsRow,
          { height: BAR_ROW_MIN_HEIGHT + bottomPadding, paddingBottom: bottomPadding },
        ]}
        onLayout={event => {
          const { height, width } = event.nativeEvent.layout

          // A hidden tab screen (display: none) reports 0×0; publishing that
          // zero would collapse every consumer of tabBarHeightAtom for a frame.
          if (height <= 0) return

          setRowWidth(width)
          setMeasuredTabBarHeight(height)
        }}
      >
        <Animated.View style={[styles.floatingIsland, glass.container, islandStyle]}>
          <GlassSurface
            isLight={isLight}
            radius={RADIUSES.round}
            key={isLight ? 'light' : 'dark'}
          />
          <Animated.View style={[styles.islandContent, contentStyle]}>
            {visibleRoutes.map(route => {
              const isActive = route.key === activeRouteKey

              return (
                <TabSlot
                  key={route.key}
                  isActive={isActive}
                  progress={progress}
                  isCollapsed={isCollapsed}
                  expandedWidth={expandedTabWidth}
                >
                  <OnboardingTarget id={`tab.${route.name}`} style={styles.tabButton}>
                    <TabButton
                      isActive={isActive}
                      routeKey={route.key}
                      routeName={route.name}
                      collapseProgress={progress}
                      isBarVisuallyCollapsed={isCollapsed}
                      isDisabled={!isTabAvailable(route.name)}
                      onPress={() => handleTabPress(route, isActive)}
                    />
                  </OnboardingTarget>
                </TabSlot>
              )
            })}
          </Animated.View>
        </Animated.View>
      </View>
      {!hideSearch && <SearchIslandMorph />}
    </Animated.View>
  )
}
