import { type BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useAtom } from '@reatom/npm-react'
import { BlurView } from 'expo-blur'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Text, TouchableOpacity, View } from 'react-native'
import { AnimatedPlayer } from 'widgets/animated-player'
import { isAudioPlayerMountedAtom } from 'shared/model'
import { RootTabName } from 'shared/routing'
import { styles } from './custom-tab-bar.styles'

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

  const [tabLayouts, setTabLayouts] = useState<{ [key: string]: { width: number; x: number } }>({})
  const indicatorPosition = useRef(new Animated.Value(0)).current
  const indicatorWidth = useRef(new Animated.Value(0)).current
  const indicatorOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const currentKey = state.routes[state.index].key
    const layout = tabLayouts[currentKey]

    if (layout) {
      Animated.parallel([
        Animated.spring(indicatorPosition, {
          friction: 30,
          tension: 300,
          toValue: layout.x,
          useNativeDriver: false,
        }),
        Animated.spring(indicatorWidth, {
          friction: 30,
          tension: 300,
          toValue: layout.width,
          useNativeDriver: false,
        }),
      ]).start()

      Animated.timing(indicatorOpacity, {
        duration: 150,
        toValue: 1,
        useNativeDriver: false,
      }).start()
    }
  }, [state.index, tabLayouts, indicatorPosition, indicatorWidth, indicatorOpacity, state.routes])

  return (
    <>
      <View style={styles.floatingContainer}>
        <BlurView tint='light' intensity={40} style={styles.floatingIsland}>
          <View style={styles.tabBar}>
            <Animated.View
              style={[
                styles.indicator,
                {
                  opacity: indicatorOpacity,
                  transform: [{ translateX: indicatorPosition }],
                  width: indicatorWidth,
                },
              ]}
            />
            {state.routes.map(({ key, name, params }) => {
              const { options } = descriptors[key]
              const { tabBarActiveTintColor, tabBarIcon, tabBarInactiveTintColor } = options

              const isActive = key === currentTab.key

              const color = (isActive ? tabBarActiveTintColor : tabBarInactiveTintColor) || 'gray'

              return (
                <TouchableOpacity
                  key={key}
                  style={styles.tabButton}
                  onPress={() => navigation.navigate(name, params)}
                  onLayout={e => {
                    setTabLayouts(prev => ({
                      ...prev,
                      [key]: {
                        width: e.nativeEvent.layout.width,
                        x: e.nativeEvent.layout.x,
                      },
                    }))
                  }}
                >
                  <View style={styles.tabItem}>
                    {tabBarIcon?.({
                      color: color,
                      focused: isActive,
                      size: 22,
                    })}
                    {isActive && <Text style={[styles.tabText, { color: color }]}>{name}</Text>}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </BlurView>
      </View>
      {showMiniPlayer && <AnimatedPlayer />}
    </>
  )
}
