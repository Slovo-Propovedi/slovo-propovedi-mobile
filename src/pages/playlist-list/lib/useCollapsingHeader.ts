import { useHeaderHeight } from 'expo-router/react-navigation'
import { useCallback, useEffect, useState } from 'react'
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import type { LayoutChangeEvent } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'

const ESTIMATED_HEADER_HEIGHT = 100
// Rough line height of the h1 title; only used until the first onTitleLayout measurement.
const ESTIMATED_TITLE_HEIGHT = 40
// The big in-content title starts TITLE_TOP_GAP below the navbar bottom (screen paddingTop = headerHeight + gap).
export const TITLE_TOP_GAP = 80
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
  const titleAppearThreshold = useSharedValue(TITLE_TOP_GAP + ESTIMATED_TITLE_HEIGHT)
  const headerHeight = useHeaderHeight() || ESTIMATED_HEADER_HEIGHT
  const [titleHeight, setTitleHeight] = useState(ESTIMATED_TITLE_HEIGHT)

  const onTitleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setTitleHeight(prev => (prev === height ? prev : height))
  }, [])

  // Threshold: the title's BOTTOM edge reaches the navbar bottom. The title sits TITLE_TOP_GAP
  // below the navbar, so the scroll distance is TITLE_TOP_GAP + titleHeight — deterministic and
  // always positive. NEVER derive it from event y: layout y is relative to FlatList's internal
  // header wrapper (≈0), which made the threshold negative (title stuck visible, bg never darkened).
  // The navbar bg reaches full opacity AND the navbar title appears at this same scrollY;
  // the bg stays fully transparent until DARKEN_START_OFFSET px before it.
  useEffect(() => {
    const threshold = TITLE_TOP_GAP + titleHeight
    titleAppearThreshold.value = threshold
    darkenStart.value = Math.max(0, threshold - DARKEN_START_OFFSET)
  }, [titleHeight, titleAppearThreshold, darkenStart])

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y
    },
  })

  return { darkenStart, headerHeight, onTitleLayout, scrollHandler, scrollY, titleAppearThreshold }
}
