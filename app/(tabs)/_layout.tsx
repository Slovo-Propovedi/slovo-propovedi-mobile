/* eslint-disable max-lines -- FIXME: refactor */
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useAtom } from '@reatom/npm-react'
import { BlurView } from 'expo-blur'
import { Tabs } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Text, TouchableOpacity, View } from 'react-native'
import { AnimatedPlayer } from 'widgets/animated-player'
import { isAudioPlayerMountedAtom } from 'shared/model'
import { COLORS } from 'shared/themed'

const BORDER_RADIUS = 30

const styles = {
  floatingContainer: {
    bottom: 10,
    elevation: 12,
    left: 10,
    position: 'absolute' as const,
    right: 10,
    zIndex: 10,
  },
  floatingIsland: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  indicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomWidth: 1,
    borderRadius: 20,
    borderRightColor: 'rgba(255, 255, 255, 0.4)',
    borderRightWidth: 1,
    bottom: 12,
    left: 0,
    position: 'absolute' as const,
    shadowColor: '#000',
    shadowOffset: { height: -2, width: -1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    top: 12,
  },
  tabBar: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: BORDER_RADIUS,
    borderBottomRightRadius: BORDER_RADIUS,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
    borderTopWidth: 1,
    flexDirection: 'row' as const,
    gap: 8,
    justifyContent: 'space-around' as const,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tabButton: {
    flex: 1,
  },
  tabItem: {
    alignItems: 'center' as const,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: 16,
  },
  tabText: {
    fontSize: 11,
    marginTop: 4,
  },
}

interface TabLayout {
  width: number
  x: number
}

const TabLayout = () => {
  const [isAudioPlayerMounted] = useAtom(isAudioPlayerMountedAtom)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [tabLayouts, setTabLayoutsState] = useState<Record<string, TabLayout>>({})
  const indicatorPosition = useRef(new Animated.Value(0)).current
  const indicatorWidth = useRef(new Animated.Value(0)).current
  const indicatorOpacity = useRef(new Animated.Value(0)).current

  const routes = [
    { key: 'listen', name: 'Слушать' },
    { key: 'read', name: 'Читать' },
    { key: 'study', name: 'Учиться' },
    { key: 'info', name: 'Информация' },
  ]

  const setTabLayout = (key: string, layout: TabLayout) => {
    setTabLayoutsState(prev => ({ ...prev, [key]: layout }))
  }

  useEffect(() => {
    const currentKey = routes[currentIndex]?.key
    const layout = currentKey ? tabLayouts[currentKey] : null

    if (!layout) return

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
  }, [currentIndex, tabLayouts])

  const showMiniPlayer = !(routes[currentIndex]?.key === 'listen' && isAudioPlayerMounted)

  const CustomTabBar = useCallback(
    ({ descriptors, navigation, state }: BottomTabBarProps) => (
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
              {state.routes.map((route, index: number) => {
                const { options: _ } = descriptors[route.key]
                const isActive = index === state.index
                const color = isActive ? COLORS.black : '#555'

                const onPress = () => {
                  const event = navigation.emit({
                    canPreventDefault: true,
                    target: route.key,
                    type: 'tabPress',
                  })

                  if (!isActive && !event.defaultPrevented) navigation.navigate(route.name)

                  setCurrentIndex(index)
                }

                const getIcon = () => {
                  if (route.name === 'study')
                    return (
                      <MaterialCommunityIcons
                        size={22}
                        color={color}
                        name={isActive ? 'notebook-edit' : 'notebook-edit-outline'}
                      />
                    )

                  if (route.name === 'listen')
                    return <AntDesign size={22} color={color} name='play-circle' />

                  if (route.name === 'info')
                    return (
                      <Ionicons
                        size={22}
                        color={color}
                        name={isActive ? 'information' : 'information-outline'}
                      />
                    )

                  return (
                    <Ionicons size={22} color={color} name={isActive ? 'book' : 'book-outline'} />
                  )
                }

                return (
                  <TouchableOpacity
                    key={route.key}
                    onPress={onPress}
                    style={styles.tabButton}
                    onLayout={e =>
                      setTabLayout(route.key, {
                        width: e.nativeEvent.layout.width,
                        x: e.nativeEvent.layout.x,
                      })
                    }
                  >
                    <View style={styles.tabItem}>
                      {getIcon()}
                      {isActive && <Text style={[styles.tabText, { color }]}>{route.name}</Text>}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </BlurView>
        </View>
        {showMiniPlayer && <AnimatedPlayer />}
      </>
    ),
    [showMiniPlayer, indicatorOpacity, indicatorPosition, indicatorWidth],
  )

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name='listen'
        options={{
          title: 'Слушать',
        }}
      />
      <Tabs.Screen
        name='read'
        options={{
          title: 'Читать',
        }}
      />
      <Tabs.Screen
        name='study'
        options={{
          title: 'Учиться',
        }}
      />
      <Tabs.Screen
        name='info'
        options={{
          title: 'Информация',
        }}
      />
    </Tabs>
  )
}

export default TabLayout
