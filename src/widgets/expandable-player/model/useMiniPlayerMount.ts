import { useEffect, useRef, useState } from 'react'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'
import { MINI_TUCK_FADE_MS } from './miniPillFade'

// The slide lands at BAR_MORPH_DURATION_MS, the delayed fade 180 ms later.
const TUCK_TEARDOWN_MS = BAR_MORPH_DURATION_MS + MINI_TUCK_FADE_MS

/**
 * Tracks whether the mini pill should stay mounted. The tucked pill must leave
 * the tree once its slide and delayed fade land: the hidden pill's play/pause
 * button sits exactly under the search ✕, so a mounted-but-faded pill catches
 * the click that closes search. Re-showing cancels the pending teardown.
 * @param isHidden - Whether the focused search field hides the pill.
 */
export const useMiniPlayerMount = (isHidden: boolean): boolean => {
  const [isMounted, setIsMounted] = useState(!isHidden)
  const teardownTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (!isHidden) {
      if (teardownTimerRef.current) {
        clearTimeout(teardownTimerRef.current)
        teardownTimerRef.current = null
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks-extra/no-direct-set-state-in-use-effect -- re-mount after the tuck teardown fired
      setIsMounted(true)
      return
    }
    // Early exit: already unmounted — no teardown timer needed (cold mount hidden)
    if (!isMounted) return
    teardownTimerRef.current = setTimeout(() => {
      teardownTimerRef.current = null
      setIsMounted(false)
    }, TUCK_TEARDOWN_MS)
    return () => {
      if (teardownTimerRef.current) {
        clearTimeout(teardownTimerRef.current)
        teardownTimerRef.current = null
      }
    }
  }, [isHidden, isMounted])

  return isMounted
}
