import { useAtom } from '@reatom/npm-react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Animated, { useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  isSearchFieldFocusedAtom,
  isSearchFieldVisibleAtom,
  isSearchQueryActive,
  searchQueryAtom,
} from 'features/sermon-search/@x/barMorph'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { BAR_BOTTOM_INSET_MIN, isTabBarMeasuredAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { getShadeColors } from '../lib/getShadeColors'
import { useProgressAnimation } from '../model/useProgressAnimation'
import { useShadeGeometry } from '../model/useShadeGeometry'
import { ShadeGradient } from './ShadeGradient'

/**
 * Vertical gradient behind the bottom chrome, rendered as the first child of the
 * tab-bar floating container. It is pill-anchored only where this zone mounts
 * the mini player (`hasMiniPlayer`) and retracts to the islands row while the
 * search field is focused. The settled chrome shapes are cut out of the
 * gradient, so the glass islands read the page through them instead of tinting
 * their own backdrop. Hidden on settled fullscreen expansion in the player
 * zone, or before the tab bar has been measured.
 * @param root0 - Component props.
 * @param root0.hasMiniPlayer - Whether this zone mounts the mini-player pill.
 * @param root0.hasSearch - Whether this zone renders the search chrome.
 */
export const BarBackdropShade = ({
  hasMiniPlayer,
  hasSearch,
}: {
  hasMiniPlayer: boolean
  hasSearch: boolean
}) => {
  const { isLight } = useTheme()
  const { bottom } = useSafeAreaInsets()
  const [audio] = useAtom(currentAudioAtom)
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const [isTabBarMeasured] = useAtom(isTabBarMeasuredAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const [isFocused] = useAtom(isSearchFieldFocusedAtom)
  const [isSearchVisible] = useAtom(isSearchFieldVisibleAtom)
  const [query] = useAtom(searchQueryAtom)
  const { height: screenHeight, width: screenWidth } = useWindowDimensions()
  // A boolean keeps the worklet closure free of the whole audio object.
  const hasAudio = !!audio
  // Pill geometry is only real in zones that mount the mini player.
  const hasPill = hasAudio && hasMiniPlayer
  const bottomPadding = Math.max(bottom, BAR_BOTTOM_INSET_MIN)
  const { holes, locations, shadeStyle } = useShadeGeometry({
    bottomPadding,
    fullScreenHeight: screenHeight,
    hasClose: isFocused || isSearchQueryActive(query),
    hasPill,
    hasSearch,
    isFocused,
    isSearchVisible,
    screenWidth,
    tabBarHeight,
  })
  // The shade has no expand animation of its own: this shared value only drives
  // the pill's settle timing, so the shade stays behind the pill for the whole
  // expand morph instead of popping out on its first frame.
  const expandProgress = useSharedValue(expanded ? 1 : 0)
  const { settledExpanded } = useProgressAnimation(expanded, expandProgress)

  if ((hasPill && expanded && settledExpanded) || !isTabBarMeasured) return null

  return (
    <Animated.View pointerEvents='none' style={styles.layer}>
      <Animated.View style={[styles.shade, shadeStyle]}>
        <ShadeGradient holes={holes} locations={locations} colors={getShadeColors(isLight)} />
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  // No zIndex: the tab-bar layer already paints above the screens, and the
  // zIndex-1 islands row beats this z-auto layer in the CSS step-8 paint order.
  // The taller inner shade overflows upward out of the container box.
  layer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  shade: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
})
