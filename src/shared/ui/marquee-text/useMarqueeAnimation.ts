import { useEffect } from 'react'
import {
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { type MarqueeCycle } from './marquee-cycle'
import { getSyncedOffset, REPEAT_SPACER } from './marquee-utils'
import { useMarqueeFrameClock } from './useMarqueeFrameClock'
import { useMarqueePartnerLoop } from './useMarqueePartnerLoop'

// Absorbs Yoga pixel-grid rounding when sizing a static centered row.
const STATIC_WIDTH_SAFETY_PX = 2

export const useMarqueeAnimation = (
  containerWidth: SharedValue<number>,
  textWidth: SharedValue<number>,
  needsMarquee: SharedValue<boolean>,
  text: string,
  isWeb: boolean,
  centerWhenStatic: boolean,
  autoStart: boolean,
  needsRepeat: boolean,
  publishCycle?: MarqueeCycle,
  followCycle?: MarqueeCycle,
) => {
  const translateX = useSharedValue(0)
  const startX = useSharedValue(0)
  // Gated consumers (sliders, track lists) start disarmed and only arm the
  // loop after a real drag; autoStart consumers (player titles) arm upfront.
  const marqueeArmed = useSharedValue(autoStart)

  const { clockPaused, frameCallback, startIdleMarquee } = useMarqueeFrameClock({
    autoStart,
    containerWidth,
    marqueeArmed,
    needsMarquee,
    // A follower derives its offset from the leader's phase — it never runs a
    // clock of its own.
    needsRepeat: followCycle ? false : needsRepeat,
    publishCycle,
    startX,
    text,
    textWidth,
    translateX,
  })

  // Mirrors JS needsRepeat onto the UI thread: the follower may only travel while
  // the duplicate copy actually exists. The UI-thread needsMarquee alone reads a
  // missing container measurement (containerWidth stays 0 on OEM builds with a
  // dead worklet onLayout) as full overflow, which sent short lines scrolling
  // with no copy to land on — they scrolled out and stayed blank until the
  // leader's cycle reset.
  const overflowConfirmed = useSharedValue(needsRepeat)

  useEffect(() => {
    overflowConfirmed.value = needsRepeat
  }, [needsRepeat, overflowConfirmed])

  // A geometry change (pill resize, new text measurement) restarts the idle
  // loop so the row re-derives its offset from fresh widths.
  useAnimatedReaction(
    () => ({ container: containerWidth.value, text: textWidth.value }),
    (current, previous) => {
      if (current.container !== previous?.container || current.text !== previous?.text)
        startIdleMarquee()
    },
  )

  // The follower publishes its own loop distance so the leader can stretch its
  // scroll phase to the LONGER of the two lines.
  useMarqueePartnerLoop(followCycle, textWidth, needsRepeat, text)

  const animatedStyle = useAnimatedStyle(() => {
    // The visible Text keeps numberOfLines={1} on native, so ANY width smaller
    // than the rendered text (pixel-grid rounding, epsilon-fitting titles) makes
    // Android word-wrap the last word onto a hidden second line — the word
    // vanishes leaving a blank gap. The static state therefore reuses the
    // marquee geometry: the row is always wide enough for the full single-line
    // text and the container's overflow: 'hidden' does the cutting, exactly
    // like the first frame of the loop.
    const marqueeWidth = textWidth.value ? textWidth.value * 2 + REPEAT_SPACER : undefined

    // centerWhenStatic needs the row ≈ text width for meaningful centering;
    // the safety margin absorbs Yoga pixel-grid rounding so it never wraps.
    const staticWidth = isWeb
      ? '100%'
      : textWidth.value
        ? textWidth.value + STATIC_WIDTH_SAFETY_PX
        : undefined

    // Followers ride the leader's published phase at the same px/ms speed: a
    // finished line lands on its duplicate at the line start and holds there,
    // and the pair cycle covers the longer of the two loops.
    const syncedOffset = followCycle
      ? getSyncedOffset(
          followCycle.scrollElapsed.value,
          followCycle.msPerPx.value,
          overflowConfirmed.value,
          textWidth.value + REPEAT_SPACER,
        )
      : null

    return {
      justifyContent: !needsMarquee.value && centerWhenStatic ? 'center' : 'flex-start',
      transform: [{ translateX: syncedOffset ?? translateX.value }],
      width: needsMarquee.value || !centerWhenStatic ? marqueeWidth : staticWidth,
    }
  })

  return {
    animatedStyle,
    clockPaused,
    frameCallback,
    marqueeArmed,
    startIdleMarquee,
    startX,
    translateX,
  }
}
