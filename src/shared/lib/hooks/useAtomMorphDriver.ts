import { useCtx } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { useFrameCallback } from 'react-native-reanimated'
import { type AtomMorphDriver } from './atomMorphDriver'

/**
 * React surface of a shared {@link AtomMorphDriver}: reads ONE module-level
 * progress value instead of starting a per-component animation, owns the
 * UI-thread frame callback that steps the clock, and exposes the settled flag
 * the React shadow tree may commit resting geometry for.
 *
 * `settled` seeds from the atom, a real flip immediately commits the START of
 * the new animation (`!isTarget`), and only the completion commits the target.
 * Committing the destination on the flip paints it for a frame before
 * Reanimated asserts the start value, then snaps back (Issue #63).
 * @param driver - Module-level driver shared by every surface of one morph.
 */
export const useAtomMorphDriver = (driver: AtomMorphDriver) => {
  const ctx = useCtx()
  const [settled, setSettled] = useState(() => {
    // Seed the module value during the FIRST mount: the subscription mirror
    // lands in an effect, one frame after the first animated style already read
    // the value. A remount while the driver is mid-flight must not snap the
    // shared value to the atom target, so only an unattached driver seeds.
    if (!driver.isAttached()) driver.seed(ctx)

    return ctx.get(driver.atom)
  })
  const handleStart = useCallback((isTarget: boolean) => setSettled(!isTarget), [])
  const handleSettled = useCallback((isTarget: boolean) => setSettled(isTarget), [])

  // The driver owns the clock state; this hook only supplies the frame
  // registration Reanimated requires. `useFrameCallback` keeps the handle
  // stable, so the effect below runs once per surface.
  const frameCallback = useFrameCallback(driver.frameStep, false)

  useEffect(() => {
    const detachStart = driver.registerStartListener(handleStart)
    const detachSettle = driver.registerSettleListener(handleSettled)
    const detachFrameHost = driver.attachFrameHost(frameCallback)

    driver.ensure(ctx)

    return () => {
      detachStart()
      detachSettle()
      detachFrameHost()
    }
  }, [ctx, driver, frameCallback, handleStart, handleSettled])

  return { progress: driver.progress, settled }
}
