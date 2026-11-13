import { type SharedValue, useAnimatedReaction } from 'react-native-reanimated'
import { type MarqueeCycle } from './marquee-cycle'
import { getPartnerLoopDistance } from './marquee-utils'

// The follower publishes its own loop distance so the leader can stretch its
// scroll phase to the LONGER of the two lines: the shorter line finishes and
// holds at its line start (duplicate visible) while the longer one completes.
// Plumbing only — the distance math lives in getPartnerLoopDistance.
export const useMarqueePartnerLoop = (
  followCycle: MarqueeCycle | undefined,
  textWidth: SharedValue<number>,
  needsRepeat: boolean,
) => {
  useAnimatedReaction(
    () => ({ overflows: needsRepeat, width: textWidth.value }),
    (current, previous) => {
      if (!followCycle) return
      if (current.width === previous?.width && current.overflows === previous?.overflows) return
      // eslint-disable-next-line react-hooks/immutability -- the follower intentionally writes the leader's shared value from the UI thread
      followCycle.partnerLoopDistance.value = getPartnerLoopDistance(
        current.overflows,
        current.width,
      )
    },
    [followCycle, needsRepeat],
  )
}
