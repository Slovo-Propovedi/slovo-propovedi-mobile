import { useAction } from '@reatom/npm-react'
import { type Tabs } from 'expo-router'
import { useState } from 'react'
import { useWindowDimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { SearchIslandMorph } from 'widgets/search-island/@x/morph'
import { OnboardingTarget } from 'features/onboarding'
import { GlassIsland } from 'shared/ui'
import {
  BAR_ROW_MIN_HEIGHT,
  setTabBarHeight,
  useBarBottomPadding,
  useKeyboardLiftStyle,
} from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { useRowInsetStyle } from '../lib/useRowInsetStyle'
import { useTabIslandMorph } from '../lib/useTabIslandMorph'
import { styles } from './styles'
import { TabButton } from './TabButton'
import { TabSlot } from './TabSlot'
import { useTabPress } from './useTabPress'

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
  const { isLight } = useTheme()
  const { handleTabPress, isTabAvailable } = useTabPress({ emitter, navigateToTab })
  const { width: windowWidth } = useWindowDimensions()
  const [rowWidth, setRowWidth] = useState(0)
  const activeRouteKey = state.routes[state.index]?.key
  const {
    contentStyle,
    expandedTabWidth,
    isCollapsed,
    isFocused,
    islandStyle,
    progress,
    restingContentStyle,
    restingIslandStyle,
    settledCollapsed,
  } = useTabIslandMorph({
    hideSearch,
    routeCount: state.routes.length,
    rowWidth,
    windowWidth,
  })
  const bottomPadding = useBarBottomPadding()
  const keyboardLiftStyle = useKeyboardLiftStyle()
  const { insetStyle, restingInsetStyle } = useRowInsetStyle()

  return (
    <Animated.View pointerEvents='box-none' style={[styles.floatingContainer, keyboardLiftStyle]}>
      <Animated.View
        pointerEvents='box-none'
        style={[
          styles.islandsRow,
          { height: BAR_ROW_MIN_HEIGHT + bottomPadding, paddingBottom: bottomPadding },
          insetStyle,
          restingInsetStyle,
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
        {/* Pass-through between the tab buttons: the glass host only positions
            them, so a drag started on its padding/gaps lands on the list behind
            the bar instead of being swallowed. */}
        <GlassIsland
          isLight={isLight}
          hostStyle={styles.floatingIsland}
          pointerEvents={isFocused ? 'none' : 'box-none'}
          animatedStyle={[islandStyle, restingIslandStyle]}
        >
          <Animated.View style={[styles.islandContent, contentStyle, restingContentStyle]}>
            {state.routes.map(route => {
              const isActive = route.key === activeRouteKey

              return (
                <TabSlot
                  key={route.key}
                  isActive={isActive}
                  progress={progress}
                  isCollapsed={isCollapsed}
                  expandedWidth={expandedTabWidth}
                  isSettledCollapsed={settledCollapsed}
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
        </GlassIsland>
      </Animated.View>
      {!hideSearch && <SearchIslandMorph />}
    </Animated.View>
  )
}
