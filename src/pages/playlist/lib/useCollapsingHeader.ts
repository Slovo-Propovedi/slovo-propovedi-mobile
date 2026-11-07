import { useAction, useAtom } from '@reatom/npm-react'
import { useHeaderHeight } from 'expo-router/react-navigation'
import { useEffect } from 'react'
import { Dimensions } from 'react-native'
import {
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { isSearchOpenAtom } from 'features/sermon-search/@x/suspension'
import { isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { nextBarCollapsedState, setBarCollapsed } from 'shared/ui/layout'

const { height: windowHeight } = Dimensions.get('window')

// Estimated header height for initial calculation (actual from useHeaderHeight)
const ESTIMATED_HEADER_HEIGHT = 100

// Base image height (50% of screen) - used for threshold calculation
const BASE_IMAGE_HEIGHT = windowHeight * 0.5

interface UseCollapsingHeaderResult {
  headerImageHeight: number
  imageOpacityStyle: ReturnType<typeof useAnimatedStyle>
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>
  scrollY: SharedValue<number>
  titleAppearThreshold: number
}

export const useCollapsingHeader = (): UseCollapsingHeaderResult => {
  const scrollY = useSharedValue(0)
  const headerHeight = useHeaderHeight() || ESTIMATED_HEADER_HEIGHT
  // The same scroll handler also drives the floating bottom bar, so the list
  // keeps a single worklet instead of stacking a second scroll handler.
  const applyBarCollapsed = useAction(setBarCollapsed)
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  const [isPlayerExpanded] = useAtom(isPlayerExpandedAtom)
  const isSuspended = isSearchOpen || isPlayerExpanded
  const isSuspendedSv = useSharedValue(isSuspended)
  const wasBarCollapsedSv = useSharedValue(false)

  // Image extends behind the header for a seamless look
  const headerImageHeight = BASE_IMAGE_HEIGHT + headerHeight

  // Title appears when scroll position reaches this threshold
  // Title is centered in headerImageContainer (which extends behind header)
  // Title center = headerImageHeight / 2, goes under header when:
  // headerImageHeight / 2 - scrollY <= headerHeight
  // scrollY >= headerImageHeight / 2 - headerHeight
  const titleAppearThreshold = headerImageHeight / 2 - headerHeight

  useEffect(() => {
    isSuspendedSv.value = isSuspended
  }, [isSuspended, isSuspendedSv])

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y

      if (isSuspendedSv.value) return

      const nextCollapsed = nextBarCollapsedState(event.contentOffset.y, wasBarCollapsedSv.value)
      if (nextCollapsed === null) return

      wasBarCollapsedSv.value = nextCollapsed
      scheduleOnRN(applyBarCollapsed, nextCollapsed)
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
    titleAppearThreshold,
  }
}
