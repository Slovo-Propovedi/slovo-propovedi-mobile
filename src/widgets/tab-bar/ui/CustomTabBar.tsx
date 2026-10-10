import { useAction } from '@reatom/npm-react'
import { BlurView } from 'expo-blur'
import { type Tabs } from 'expo-router'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { setTabBarHeight } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'
import { TabButton } from './TabButton'
import { useTabPress } from './useTabPress'

// Минимальный отступ снизу — зона жестов; на 3-кнопочной навигации берётся высота навбара
// из safe-area insets (Issue #56)
const MIN_TAB_BAR_BOTTOM_PADDING = 30

interface CustomTabBarProps extends TabBarProps {
  hideFloatingPlayer?: boolean
}

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0]

export const CustomTabBar = ({ hideFloatingPlayer: _, navigation, state }: CustomTabBarProps) => {
  const setMeasuredTabBarHeight = useAction(setTabBarHeight)
  const { bottom } = useSafeAreaInsets()
  const { isLight } = useTheme()
  const { handleTabPress, isTabAvailable } = useTabPress({ navigation })

  return (
    <View style={styles.floatingContainer}>
      <BlurView
        intensity={70}
        key={isLight ? 'light' : 'dark'}
        tint={isLight ? 'light' : 'dark'}
        onLayout={event => {
          setMeasuredTabBarHeight(event.nativeEvent.layout.height)
        }}
        style={[
          styles.floatingIsland,
          { backgroundColor: isLight ? 'rgba(230, 230, 230, 0.9)' : 'rgba(0, 0, 0, 0.85)' },
        ]}
      >
        <View
          style={[styles.tabBar, { paddingBottom: Math.max(bottom, MIN_TAB_BAR_BOTTOM_PADDING) }]}
        >
          {state.routes.map((route, index: number) => {
            const isActive = index === state.index

            return (
              <TabButton
                key={route.key}
                isActive={isActive}
                routeKey={route.key}
                routeName={route.name}
                isDisabled={!isTabAvailable(route.name)}
                onPress={() => handleTabPress(route, isActive)}
              />
            )
          })}
        </View>
      </BlurView>
    </View>
  )
}
