import { BlurView } from 'expo-blur'
import { type Tabs } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { styles } from './styles'
import { TabButton } from './TabButton'
import { TabIndicator } from './TabIndicator'
import { useTabIndicator } from './useTabIndicator'

interface TabLayout {
  width: number
  x: number
}

const ROUTES = [
  { key: 'listen', name: 'Слушать' },
  { key: 'read', name: 'Читать' },
  { key: 'study', name: 'Учиться' },
  { key: 'more', name: 'Еще' },
]

interface CustomTabBarProps extends TabBarProps {
  currentIndex: number
  hideFloatingPlayer?: boolean
  setCurrentIndex: (index: number) => void
  setTabLayout: (key: string, layout: TabLayout) => void
  tabLayouts: Record<string, TabLayout>
}

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0]

export const CustomTabBar = ({
  currentIndex,
  descriptors,
  hideFloatingPlayer: _,
  navigation,
  setCurrentIndex,
  setTabLayout,
  state,
  tabLayouts,
}: CustomTabBarProps) => {
  const [unavailableDialogVisible, setUnavailableDialogVisible] = useState(false)
  const currentKey = ROUTES[currentIndex]?.key
  const { indicatorOpacity, indicatorPosition, indicatorWidth } = useTabIndicator(
    currentIndex,
    tabLayouts,
    currentKey,
  )

  return (
    <View style={styles.floatingContainer}>
      <BlurView tint='dark' intensity={70} style={styles.floatingIsland}>
        <View style={styles.tabBar}>
          <TabIndicator
            width={indicatorWidth}
            opacity={indicatorOpacity}
            position={indicatorPosition}
          />
          {state.routes.map((route, index: number) => {
            const { options: _options } = descriptors[route.key]
            const isActive = index === state.index

            const onPress = () => {
              if (route.name === 'read' || route.name === 'study') {
                setUnavailableDialogVisible(true)
                return
              }

              const event = navigation.emit({
                canPreventDefault: true,
                target: route.key,
                type: 'tabPress',
              })

              if (!isActive && !event.defaultPrevented) navigation.navigate(route.name)

              setCurrentIndex(index)
            }

            return (
              <TabButton
                key={route.key}
                onPress={onPress}
                isActive={isActive}
                routeKey={route.key}
                routeName={route.name}
                onLayout={layout => setTabLayout(route.key, layout)}
                isDisabled={route.name === 'read' || route.name === 'study'}
              />
            )
          })}
        </View>
      </BlurView>
      <ConfirmDialog
        hideCancel
        title='Скоро будет доступно'
        visible={unavailableDialogVisible}
        onCancel={() => setUnavailableDialogVisible(false)}
        onConfirm={() => setUnavailableDialogVisible(false)}
        message='Этот раздел будет реализован в будущих обновлениях'
      />
    </View>
  )
}
