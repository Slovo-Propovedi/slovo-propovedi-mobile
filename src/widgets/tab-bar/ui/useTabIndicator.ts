import { useEffect, useState } from 'react'
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
  const [indicatorPosition] = useState(() => new Animated.Value(0))
  const [indicatorWidth] = useState(() => new Animated.Value(0))
  const [indicatorOpacity] = useState(() => new Animated.Value(0))

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
  }, [currentIndex, indicatorOpacity, indicatorPosition, indicatorWidth, tabLayouts, currentKey])

  return {
    indicatorOpacity,
    indicatorPosition,
    indicatorWidth,
  }
}
