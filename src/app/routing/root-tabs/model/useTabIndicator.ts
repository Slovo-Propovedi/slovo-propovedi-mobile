import { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'

interface TabLayout {
  width: number
  x: number
}

interface UseTabIndicator {
  currentIndex: number
  routes: Array<{ key: string }>
}

interface UseTabIndicatorReturn {
  indicatorOpacity: Animated.Value
  indicatorPosition: Animated.Value
  indicatorWidth: Animated.Value
  setTabLayout: (key: string, layout: TabLayout) => void
  tabLayouts: Record<string, TabLayout>
}

export const useTabIndicator = ({
  currentIndex,
  routes,
}: UseTabIndicator): UseTabIndicatorReturn => {
  const [tabLayouts, setTabLayoutsState] = useState<Record<string, TabLayout>>({})
  const indicatorPosition = useRef(new Animated.Value(0)).current
  const indicatorWidth = useRef(new Animated.Value(0)).current
  const indicatorOpacity = useRef(new Animated.Value(0)).current

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
  }, [currentIndex, routes, tabLayouts, indicatorPosition, indicatorWidth, indicatorOpacity])

  return {
    indicatorOpacity,
    indicatorPosition,
    indicatorWidth,
    setTabLayout,
    tabLayouts,
  }
}
