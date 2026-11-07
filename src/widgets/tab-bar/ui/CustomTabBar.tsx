import { Ionicons } from '@expo/vector-icons'
import { useAction } from '@reatom/npm-react'
import { BlurView } from 'expo-blur'
import { type Tabs } from 'expo-router'
import { useState } from 'react'
import { useWindowDimensions, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { OnboardingTarget } from 'features/onboarding'
import { useOpenSearch } from 'features/sermon-search'
import { BAR_ROW_MIN_HEIGHT, setTabBarHeight } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { useTabIslandMorph } from '../lib/useTabIslandMorph'
import { CircleButton } from './CircleButton'
import { ISLAND_BACKGROUND_DARK, ISLAND_BACKGROUND_LIGHT, styles } from './styles'
import { TabButton } from './TabButton'
import { TabSlot } from './TabSlot'
import { useTabPress } from './useTabPress'

// Минимальный отступ снизу — зона жестов; на 3-кнопочной навигации берётся высота навбара
// из safe-area insets (Issue #56)
const MIN_TAB_BAR_BOTTOM_PADDING = 30
const SEARCH_ICON_SIZE = 24
const SEARCH_LABEL = 'Поиск'
const SEARCH_TARGET_ID = 'listen.search-toggle'

interface CustomTabBarProps extends TabBarProps {
  hideFloatingPlayer?: boolean
  /** Admin tab layouts have no global search. */
  hideSearch?: boolean
}

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0]

export const CustomTabBar = ({
  emitter,
  hideFloatingPlayer: _,
  hideSearch = false,
  navigateToTab,
  state,
}: CustomTabBarProps) => {
  const setMeasuredTabBarHeight = useAction(setTabBarHeight)
  const { bottom } = useSafeAreaInsets()
  const { currentTheme, isLight } = useTheme()
  const { handleTabPress, isTabAvailable } = useTabPress({ emitter, navigateToTab })
  const openSearch = useOpenSearch()
  const { width: windowWidth } = useWindowDimensions()
  const [rowWidth, setRowWidth] = useState(0)
  const { expandedTabWidth, islandStyle, progress } = useTabIslandMorph({
    hideSearch,
    routeCount: state.routes.length,
    rowWidth,
    windowWidth,
  })
  const bottomPadding = Math.max(bottom, MIN_TAB_BAR_BOTTOM_PADDING)

  return (
    <View style={styles.floatingContainer}>
      <View
        style={[
          styles.islandsRow,
          { height: BAR_ROW_MIN_HEIGHT + bottomPadding, paddingBottom: bottomPadding },
        ]}
        onLayout={event => {
          setRowWidth(event.nativeEvent.layout.width)
          setMeasuredTabBarHeight(event.nativeEvent.layout.height)
        }}
      >
        <Animated.View style={[styles.floatingIsland, islandStyle]}>
          <BlurView
            intensity={70}
            key={isLight ? 'light' : 'dark'}
            tint={isLight ? 'light' : 'dark'}
            style={[
              styles.blurFill,
              { backgroundColor: isLight ? ISLAND_BACKGROUND_LIGHT : ISLAND_BACKGROUND_DARK },
            ]}
          />
          <View style={styles.islandContent}>
            {state.routes.map((route, index: number) => {
              const isActive = index === state.index

              return (
                <TabSlot
                  key={route.key}
                  isActive={isActive}
                  progress={progress}
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
          </View>
        </Animated.View>
        {!hideSearch && (
          <OnboardingTarget id={SEARCH_TARGET_ID}>
            <CircleButton onPress={openSearch} accessibilityLabel={SEARCH_LABEL}>
              <Ionicons name='search' size={SEARCH_ICON_SIZE} color={currentTheme.text} />
            </CircleButton>
          </OnboardingTarget>
        )}
      </View>
    </View>
  )
}
