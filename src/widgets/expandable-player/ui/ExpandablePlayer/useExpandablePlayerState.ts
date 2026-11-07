import { useAtom } from '@reatom/npm-react'
import { useRef } from 'react'
import { useIsSearchOpen } from 'features/sermon-search'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  isBufferingAtom,
  isPlayerExpandedAtom,
  isPlayingAtom,
  useGuardedTogglePlay,
} from 'entities/player'
import { isBarCollapsedAtom, isTabBarMeasuredAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { PLAYER_SIZES, useTheme } from 'shared/ui/theme'

/**
 * Bundles the atoms and theme the expandable player reads, so the component
 * keeps a flat body within the file line budget.
 */
export const useExpandablePlayerState = () => {
  const { currentTheme } = useTheme()
  const [measuredTabBarHeight] = useAtom(tabBarHeightAtom)
  // A non-focused root-stack screen renders the tabs with `display: none` on web
  // (and may detach them natively), so the tab row's onLayout reports a 0 height
  // while hidden. Adopting 0 would park the pill at the very bottom of the screen
  // and the first visible frame after navigating back would show it there until
  // the row re-measures (Issue #132). A non-positive height is not a measurement:
  // keep the last real one.
  const lastValidTabBarHeightRef = useRef(
    measuredTabBarHeight > 0 ? measuredTabBarHeight : PLAYER_SIZES.tabBarHeight,
  )
  // eslint-disable-next-line react-hooks/refs -- intentional: retain the last real onLayout height across renders
  if (measuredTabBarHeight > 0) lastValidTabBarHeightRef.current = measuredTabBarHeight
  // eslint-disable-next-line react-hooks/refs -- intentional: the retained height is the player's trusted geometry input
  const tabBarHeight = lastValidTabBarHeightRef.current
  const [audio] = useAtom(currentAudioAtom)
  const [isTabBarMeasured] = useAtom(isTabBarMeasuredAtom)
  const [isBarCollapsed] = useAtom(isBarCollapsedAtom)
  const isSearchOpen = useIsSearchOpen()
  const [playing] = useAtom(isPlayingAtom)
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const [isBuffering] = useAtom(isBufferingAtom)
  const { togglePlay } = useGuardedTogglePlay()

  return {
    audio,
    currentTheme,
    expanded,
    // While search is open the bottom row is [active tab circle][search field],
    // so the mini player rests detached above it instead of collapsing into it.
    isBarCollapsed: isBarCollapsed && !isSearchOpen,
    isBuffering,
    isTabBarMeasured,
    playing,
    playlist,
    tabBarHeight,
    togglePlay,
  }
}
