import { useEffect, useState } from 'react'
import { withDelay, withTiming } from 'react-native-reanimated'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'
import { MINI_TUCK_FADE_MS, miniPillOpacitySv } from './miniPillFade'

/**
 * Drives the shared mini-pill fade: on focus the pill slides under first, then
 * fades out; on blur it fades back in while the pill slides up. The shared
 * value outlives the component, so a fresh mount seeds it from the atom state
 * during the first render instead of animating from a stale value.
 * @param isHidden - Whether the focused search field hides the pill.
 */
export const useMiniPillFade = (isHidden: boolean) => {
  // Seeding in a state initializer runs in the first render (the same contract
  // as `useAtomMorphDriver.seed`): the first animated style already reads the
  // current state, and a remount mid-fade cannot snap the shared value.
  useState(() => {
    miniPillOpacitySv.value = isHidden ? 0 : 1

    return null
  })

  useEffect(() => {
    // The player root drops below the tab bar before the first tucked frame.
    miniPillOpacitySv.value = isHidden
      ? withDelay(BAR_MORPH_DURATION_MS, withTiming(0, { duration: MINI_TUCK_FADE_MS }))
      : withTiming(1, { duration: MINI_TUCK_FADE_MS })
  }, [isHidden])

  return miniPillOpacitySv
}
