import { useHeaderHeight } from 'expo-router/react-navigation'
import { useCallback, useEffect, useState } from 'react'
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import type { LayoutChangeEvent } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'

const ESTIMATED_HEADER_HEIGHT = 100

// Navbar bg darkens over the last 80px before the title-appear threshold (same mechanic as the playlist screen).
const DARKEN_START_OFFSET = 80

interface UseCollapsingHeaderResult {
  darkenStart: SharedValue<number>
  headerHeight: number
  onTitleLayout: (event: LayoutChangeEvent) => void
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>
  scrollY: SharedValue<number>
  titleAppearThreshold: SharedValue<number>
}

export const useCollapsingHeader = (): UseCollapsingHeaderResult => {
  const scrollY = useSharedValue(0)
  const darkenStart = useSharedValue(0)
  const titleAppearThreshold = useSharedValue(Number.MAX_SAFE_INTEGER)
  const headerHeight = useHeaderHeight() || ESTIMATED_HEADER_HEIGHT
  const [titleLayout, setTitleLayout] = useState({ height: 0, top: 0 })

  const onTitleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height, y } = event.nativeEvent.layout
    setTitleLayout(prev => (prev.height === height && prev.top === y ? prev : { height, top: y }))
  }, [])

  // Threshold: the title's BOTTOM edge reaches the navbar bottom.
  // The navbar bg reaches full opacity AND the navbar title appears at this same scrollY.
  // The bg stays fully transparent until DARKEN_START_OFFSET px before the threshold.
  useEffect(() => {
    if (titleLayout.height > 0) {
      const threshold = titleLayout.top + titleLayout.height - headerHeight
      titleAppearThreshold.value = threshold
      darkenStart.value = Math.max(0, threshold - DARKEN_START_OFFSET)
    }
  }, [titleLayout, headerHeight, titleAppearThreshold, darkenStart])

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y
    },
  })

  return { darkenStart, headerHeight, onTitleLayout, scrollHandler, scrollY, titleAppearThreshold }
}
