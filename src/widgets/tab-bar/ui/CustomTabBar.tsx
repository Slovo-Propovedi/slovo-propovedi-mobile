import { Ionicons } from '@expo/vector-icons'
import { useAction } from '@reatom/npm-react'
import { type Tabs } from 'expo-router'
import { useState } from 'react'
import { useWindowDimensions, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { OnboardingTarget } from 'features/onboarding'
import { useIsSearchFieldVisible, useOpenSearch } from 'features/sermon-search'
import { createGlassStyles, GlassSurface } from 'shared/ui'
import { BAR_BOTTOM_INSET_MIN, BAR_ROW_MIN_HEIGHT, setTabBarHeight } from 'shared/ui/layout'
import { RADIUSES, useTheme } from 'shared/ui/theme'
import { useTabIslandMorph } from '../lib/useTabIslandMorph'
import { CircleButton } from './CircleButton'
import { styles } from './styles'
import { TabButton } from './TabButton'
import { TabSlot } from './TabSlot'
import { useTabPress } from './useTabPress'

// На 3-кнопочной навигации берётся высота навбара из safe-area insets (Issue #56);
// без неё острова сидят низко с небольшим нижним зазором.
const SEARCH_ICON_SIZE = 24
const SEARCH_LABEL = 'Поиск'
const SEARCH_TARGET_ID = 'listen.search-toggle'
// «Учиться» keeps its /study route (deep links, direct navigation) but has no
// button in the bar anymore.
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
  const { currentTheme, isLight } = useTheme()
  const { handleTabPress, isTabAvailable } = useTabPress({ emitter, navigateToTab })
  const openSearch = useOpenSearch()
  const isSearchFieldVisible = useIsSearchFieldVisible()
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

  return (
    <View pointerEvents='box-none' style={styles.floatingContainer}>
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
                      isDisabled={!isTabAvailable(route.name)}
                      onPress={() => handleTabPress(route, isActive)}
                    />
                  </OnboardingTarget>
                </TabSlot>
              )
            })}
          </Animated.View>
        </Animated.View>
        {!hideSearch && !isSearchFieldVisible && (
          <OnboardingTarget id={SEARCH_TARGET_ID}>
            <CircleButton
              progress={progress}
              onPress={openSearch}
              accessibilityLabel={SEARCH_LABEL}
            >
              <Ionicons name='search' size={SEARCH_ICON_SIZE} color={currentTheme.text} />
            </CircleButton>
          </OnboardingTarget>
        )}
      </View>
    </View>
  )
}
