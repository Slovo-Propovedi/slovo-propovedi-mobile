import { useAtom } from '@reatom/npm-react'
import { useRef } from 'react'
import { useIsSearchFieldVisible } from 'features/sermon-search'
import { isSearchFieldFocusedAtom } from 'features/sermon-search/@x/barMorph'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  isBufferingAtom,
  isPlayerExpandedAtom,
  isPlayingAtom,
  useGuardedTogglePlay,
} from 'entities/player'
import { isBarCollapsedAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { PLAYER_SIZES, useTheme } from 'shared/ui/theme'

/**
 * Bundles the atoms and theme the expandable player reads, so the component
 * keeps a flat body within the file line budget.
 */
export const useExpandablePlayerState = () => {
  const { currentTheme, isLight } = useTheme()
  const [publishedTabBarHeight] = useAtom(tabBarHeightAtom)
  // The publisher derives the height (`useTabBarMeasurement`) and ignores
  // zero/short onLayout reports, so this retention guard is vestigial — kept as
  // a cheap data-boundary fallback: a non-positive height is still not a
  // measurement and must not become the pill's geometry (Issue #132).
  const lastKnownTabBarHeightRef = useRef(
    publishedTabBarHeight > 0 ? publishedTabBarHeight : PLAYER_SIZES.tabBarHeight,
  )
  // eslint-disable-next-line react-hooks/refs -- intentional: retain the last known height across renders
  if (publishedTabBarHeight > 0) lastKnownTabBarHeightRef.current = publishedTabBarHeight
  // eslint-disable-next-line react-hooks/refs -- intentional: the retained height is the player's trusted geometry input
  const tabBarHeight = lastKnownTabBarHeightRef.current
  const [audio] = useAtom(currentAudioAtom)
  const [isBarCollapsed] = useAtom(isBarCollapsedAtom)
  const isSearchFieldVisible = useIsSearchFieldVisible()
  const [isSearchFieldFocused] = useAtom(isSearchFieldFocusedAtom)
  const [playing] = useAtom(isPlayingAtom)
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const [isBuffering] = useAtom(isBufferingAtom)
  const { togglePlay } = useGuardedTogglePlay()

  return {
    audio,
    currentTheme,
    expanded,
    // While the search field is visible the bottom row is [active tab
    // circle][search field], so the mini player rests detached above it instead
    // of collapsing into it. A collapsed bar with an empty query hides the field
    // and pulls the player back into the compact line. Focus hides the player
    // entirely (see ExpandablePlayer), so it does not affect the pose.
    isBarCollapsed: isBarCollapsed && !isSearchFieldVisible,
    isBuffering,
    isLight,
    // The mini pill tucks under the bottom islands only while the input field
    // itself has focus; dialogs that hold the search focus leave it in place.
    // Its whole subtree must drop below the tab bar's zIndex 10 while tucked.
    isPillTucked: isSearchFieldFocused && !expanded,
    playing,
    playlist,
    tabBarHeight,
    togglePlay,
  }
}
