import {
  type BottomTabBarProps,
  type BottomTabNavigationEventMap,
} from '@react-navigation/bottom-tabs'
import { type NavigationHelpers } from '@react-navigation/native'
import { useAtom } from '@reatom/npm-react'
import { BlurView } from 'expo-blur'
import React from 'react'
import { View } from 'react-native'
import { AnimatedPlayer } from 'widgets/animated-player'
import { isAudioPlayerMountedAtom } from 'shared/model'
import { RootTabName, type RootTabsParamList } from 'shared/routing'
import { styles } from './custom-tab-bar.styles'
import { useTabIndicator } from './model/useTabIndicator'
import { useTabNavigation } from './model/useTabNavigation'
import { TabButton } from './ui/TabButton'
import { TabIndicator } from './ui/TabIndicator'

export const CustomTabBar = ({
  descriptors,
  navigation,
  state,
  state: {
    routes: { [state.index]: currentTab },
  },
}: BottomTabBarProps) => {
  const [isAudioPlayerMounted] = useAtom(isAudioPlayerMountedAtom)
  const showMiniPlayer = !(currentTab.name === RootTabName.Listen && isAudioPlayerMounted)

  const handleTabPress = useTabNavigation({
    navigation: navigation as NavigationHelpers<RootTabsParamList, BottomTabNavigationEventMap>,
  })

  const { indicatorOpacity, indicatorPosition, indicatorWidth, setTabLayout } = useTabIndicator({
    currentIndex: state.index,
    routes: state.routes,
  })

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
            {state.routes.map(({ key, name, params }) => {
              const typedName = name as RootTabName
              const { options } = descriptors[key]
              const isActive = key === currentTab.key

              return (
                <TabButton
                  key={key}
                  name={typedName}
                  options={options}
                  isActive={isActive}
                  onPress={() => handleTabPress(typedName, params, isActive)}
                  onLayout={(layout: { width: number; x: number }) => setTabLayout(key, layout)}
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
