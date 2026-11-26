import { useAtom } from '@reatom/npm-react'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'

// Scrolling may collapse the floating bottom bar only while the mini player
// is on screen: with no active sermon the collapsed circles leave a dead gap
// where the player used to sit. Also suspended while the expanded player owns
// the screen. Search no longer suspends it: the field lives on the page, so
// scrolling its results collapses the bar like any other list.
export const useIsBarCollapseSuspended = () => {
  const [isPlayerExpanded] = useAtom(isPlayerExpandedAtom)
  const [currentAudio] = useAtom(currentAudioAtom)

  return isPlayerExpanded || currentAudio === null
}
