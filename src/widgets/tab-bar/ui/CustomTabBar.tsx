import { useAction, useAtom } from '@reatom/npm-react'
import { BlurView } from 'expo-blur'
import { Color, type Tabs } from 'expo-router'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { setTabBarHeight } from 'shared/ui/layout'
import { dynamicColorsEnabledAtom, useTheme } from 'shared/ui/theme'
import { styles } from './styles'
import { TabButton } from './TabButton'
import { TabIndicator } from './TabIndicator'
import { useTabIndicator } from './useTabIndicator'
import { isUnavailableTabRoute, useTabPress } from './useTabPress'

const ROUTES = [
  { key: 'listen', name: 'Слушать' },
  { key: 'read', name: 'Читать' },
  { key: 'study', name: 'Учиться' },
  { key: 'more', name: 'Еще' },
]

// Минимальный отступ снизу — зона жестов; на 3-кнопочной навигации берётся высота навбара
// из safe-area insets (Issue #56)
const MIN_TAB_BAR_BOTTOM_PADDING = 30

interface CustomTabBarProps extends TabBarProps {
  currentIndex: number
  hideFloatingPlayer?: boolean
  setCurrentIndex: (index: number) => void
  setTabLayout: (key: string, layout: { width: number; x: number }) => void
  tabLayouts: Record<string, { width: number; x: number }>
}

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0]

export const CustomTabBar = ({
  currentIndex,
  hideFloatingPlayer: _,
  navigation,
  setCurrentIndex,
  setTabLayout,
  state,
  tabLayouts,
}: CustomTabBarProps) => {
  const [dynamicEnabled] = useAtom(dynamicColorsEnabledAtom)
  const setMeasuredTabBarHeight = useAction(setTabBarHeight)
  const currentKey = ROUTES[currentIndex]?.key
  const { bottom } = useSafeAreaInsets()
  const { isLight } = useTheme()
  const { handleTabPress, hideUnavailableDialog, unavailableDialogVisible } = useTabPress({
    navigation,
    setCurrentIndex,
  })
  const indicatorColor =
    dynamicEnabled && Platform.OS === 'android'
      ? Color.android.dynamic.primaryContainer
      : 'rgba(241, 96, 49, 0.15)'
  const { indicatorOpacity, indicatorPosition, indicatorWidth } = useTabIndicator(
    currentIndex,
    tabLayouts,
    currentKey,
  )

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
          <TabIndicator
            color={indicatorColor}
            width={indicatorWidth}
            opacity={indicatorOpacity}
            position={indicatorPosition}
          />
          {state.routes.map((route, index: number) => {
            const isActive = index === state.index

            return (
              <TabButton
                key={route.key}
                isActive={isActive}
                routeKey={route.key}
                routeName={route.name}
                isDisabled={isUnavailableTabRoute(route.name)}
                onLayout={layout => setTabLayout(route.key, layout)}
                onPress={() => handleTabPress(route, index, isActive)}
              />
            )
          })}
        </View>
      </BlurView>
      <ConfirmDialog
        hideCancel
        title='Скоро будет доступно'
        onCancel={hideUnavailableDialog}
        onConfirm={hideUnavailableDialog}
        visible={unavailableDialogVisible}
        message='Этот раздел будет реализован в будущих обновлениях'
      />
    </View>
  )
}
