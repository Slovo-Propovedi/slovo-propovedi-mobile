import { type BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useAtom } from '@reatom/npm-react'
import { BlurView } from 'expo-blur'
import React from 'react'
import { View } from 'react-native'
import { AnimatedPlayer } from 'widgets/animated-player'
import { isAudioPlayerMountedAtom } from 'shared/model'
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
  { key: 'info', name: 'Информация' },
]

interface CustomTabBarProps extends BottomTabBarProps {
  currentIndex: number
  setCurrentIndex: (index: number) => void
  setTabLayout: (key: string, layout: TabLayout) => void
  tabLayouts: Record<string, TabLayout>
}

export const CustomTabBar = ({
  currentIndex,
  descriptors,
  navigation,
  setCurrentIndex,
  setTabLayout,
  state,
  tabLayouts,
}: CustomTabBarProps) => {
  const [isAudioPlayerMounted] = useAtom(isAudioPlayerMountedAtom)

  const currentKey = ROUTES[currentIndex]?.key
  const { indicatorOpacity, indicatorPosition, indicatorWidth } = useTabIndicator(
    currentIndex,
    tabLayouts,
    currentKey,
  )

  const showMiniPlayer = !(currentKey === 'listen' && isAudioPlayerMounted)

  return (
    <>
      <View style={styles.floatingContainer}>
        <BlurView tint='light' intensity={40} style={styles.floatingIsland}>
          <View style={styles.tabBar}>
            <TabIndicator
              width={indicatorWidth}
              opacity={indicatorOpacity}
              position={indicatorPosition}
            />
            {state.routes.map((route, index: number) => {
              const { options: _ } = descriptors[route.key]
              const isActive = index === state.index

              const onPress = () => {
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
                />
              )
            })}
          </View>
        </BlurView>
      </View>
      {showMiniPlayer && <AnimatedPlayer />}
    </>
  )
}
