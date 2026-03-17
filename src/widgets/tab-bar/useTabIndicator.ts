import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

interface TabLayout {
  width: number
  x: number
}

export const useTabIndicator = (
  currentIndex: number,
  tabLayouts: Record<string, TabLayout>,
  currentKey: string | undefined,
) => {
  const indicatorPosition = useRef(new Animated.Value(0)).current
  const indicatorWidth = useRef(new Animated.Value(0)).current
  const indicatorOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
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
  }, [currentIndex, tabLayouts, currentKey, indicatorPosition, indicatorWidth, indicatorOpacity])

  return {
    indicatorOpacity,
    indicatorPosition,
    indicatorWidth,
  }
}
