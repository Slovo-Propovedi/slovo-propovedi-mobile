import { useAtom } from '@reatom/npm-react'
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
import { useTheme } from 'shared/ui/theme'

/**
 * Bundles the atoms and theme the expandable player reads, so the component
 * keeps a flat body within the file line budget.
 */
export const useExpandablePlayerState = () => {
  const { currentTheme } = useTheme()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
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
