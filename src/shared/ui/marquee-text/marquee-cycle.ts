import { useMemo } from 'react'
import { type SharedValue, useSharedValue } from 'react-native-reanimated'

/**
 * The leading row's marquee cycle, published on the UI thread and read by
 * followers (the mini-player subtitle). No worklet → JS hop is involved: the
 * leader writes shared values every frame, followers derive their offset from
 * them.
 */
export interface MarqueeCycle {
  /** Leader speed in milliseconds per pixel; 0 while the leader is static. */
  msPerPx: SharedValue<number>
  /** Milliseconds into the leader's current scroll phase; 0 during the pause. */
  scrollElapsed: SharedValue<number>
  /** Duration of the leader's scroll phase; 0 while the leader is static. */
  scrollMs: SharedValue<number>
  /** Increments once per leader scroll-phase start (a restart the follower can observe). */
  startToken: SharedValue<number>
}

// Shared-value writes live here so the clock hook stays within the line budget
// and every "publish/reset" site has identical semantics.
export const resetMarqueeCycle = (cycle?: MarqueeCycle) => {
  'worklet'
  if (!cycle) return
  cycle.msPerPx.value = 0
  cycle.scrollElapsed.value = 0
  cycle.scrollMs.value = 0
}

export const publishMarqueePhase = (
  cycle: MarqueeCycle | undefined,
  scrollElapsed: number,
  scrollMs: number,
  msPerPx: number,
  started: boolean,
) => {
  'worklet'
  if (!cycle) return
  if (started) cycle.startToken.value += 1
  cycle.msPerPx.value = msPerPx
  cycle.scrollElapsed.value = scrollElapsed
  cycle.scrollMs.value = scrollMs
}

export const useMarqueeCycle = (): MarqueeCycle => {
  const msPerPx = useSharedValue(0)
  const scrollElapsed = useSharedValue(0)
  const scrollMs = useSharedValue(0)
  const startToken = useSharedValue(0)

  // useSharedValue identities are stable for the component lifetime, so the
  // cycle object is stable too — memoised consumers do not re-render.
  return useMemo(
    () => ({ msPerPx, scrollElapsed, scrollMs, startToken }),
    [msPerPx, scrollElapsed, scrollMs, startToken],
  )
}
