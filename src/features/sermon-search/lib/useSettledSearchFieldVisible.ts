import { useAtom } from '@reatom/npm-react'
import { useCallback, useState } from 'react'
import { useAtomMorphProgress } from 'shared/lib/hooks/useAtomMorphProgress'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'
import { isSearchFieldVisibleAtom } from '../model-searchField'

/**
 * Whether the search pill is still the bottom row's single shadow carrier.
 *
 * The pill frame disappears by geometry at the settle frame, not by fading
 * (`getSearchIslandOpacity`). The circle, however, mounts on the visibility
 * flip that starts the close morph, so it would paint its own glass shadow for
 * the whole 300 ms next to the shrinking pill's shadow. This signal keeps the
 * circle shadowless from the open flip until the close morph has settled:
 * true = pill visible or still animating, false = search fully closed.
 */
export const useSettledSearchFieldVisible = () => {
  const [isSearchFieldVisible] = useAtom(isSearchFieldVisibleAtom)
  const [isSettledVisible, setIsSettledVisible] = useState(isSearchFieldVisible)
  const markVisible = useCallback((isTarget: boolean) => {
    if (isTarget) setIsSettledVisible(true)
  }, [])
  const markClosed = useCallback((isTarget: boolean) => {
    if (!isTarget) setIsSettledVisible(false)
  }, [])

  useAtomMorphProgress(isSearchFieldVisibleAtom, BAR_MORPH_DURATION_MS, markClosed, markVisible)

  return isSettledVisible
}
