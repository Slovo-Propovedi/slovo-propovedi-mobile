import { useHeaderHeight } from '@react-navigation/elements'
import { useCallback } from 'react'
import { Dimensions } from 'react-native'
import {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'

const { height: windowHeight } = Dimensions.get('window')

// Estimated header height for initial calculation (actual from useHeaderHeight)
const ESTIMATED_HEADER_HEIGHT = 100

// Base image height (50% of screen) - used for threshold calculation
const BASE_IMAGE_HEIGHT = windowHeight * 0.5

// When the title reaches this scroll position, show header title
export const TITLE_APPEAR_THRESHOLD = BASE_IMAGE_HEIGHT * 0.7

interface UseCollapsingHeaderResult {
  headerImageHeight: number
  imageOpacityStyle: ReturnType<typeof useAnimatedStyle>
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>
  scrollY: SharedValue<number>
  updateHeaderTitle: (shouldShowTitle: boolean) => void
}

export const useCollapsingHeader = (
  title: string,
  navigation: {
    setOptions: (options: { headerTitle: string }) => void
  },
): UseCollapsingHeaderResult => {
  const scrollY = useSharedValue(0)
  const headerHeight = useHeaderHeight() || ESTIMATED_HEADER_HEIGHT

  // Image extends behind the header for a seamless look
  const headerImageHeight = BASE_IMAGE_HEIGHT + headerHeight

  const updateHeaderTitle = useCallback(
    (shouldShowTitle: boolean) => {
      navigation.setOptions({
        headerTitle: shouldShowTitle ? title : '',
      })
    },
    [navigation, title],
  )

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y
    },
  })

  // Image fades from 1 to 0.3 as user scrolls the full image height
  const imageOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, headerImageHeight], [1, 0.3], 'clamp'),
  }))

  return {
    headerImageHeight,
    imageOpacityStyle,
    scrollHandler,
    scrollY,
    updateHeaderTitle,
  }
}
