import { useAtom } from '@reatom/npm-react'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { useIsSearchBarCollapseSuspended } from './useIsSearchBarCollapseSuspended'

// Scrolling may collapse the floating bottom bar only while the mini player
// is on screen: with no active sermon the collapsed circles leave a dead gap
// where the player used to sit. Also suspended while the expanded player or
// an active search owns the screen.
export const useIsBarCollapseSuspended = () => {
  const [isPlayerExpanded] = useAtom(isPlayerExpandedAtom)
  const [currentAudio] = useAtom(currentAudioAtom)
  const isSearchBarCollapseSuspended = useIsSearchBarCollapseSuspended()

  return isPlayerExpanded || currentAudio === null || isSearchBarCollapseSuspended
}
