import { useState } from 'react'

/**
 * Persistent stand-in for Reanimated's `useSharedValue` in jest.
 *
 * The shared reanimated mock rebuilds `useSharedValue` on every render, which
 * hides the real engine's persistence: a channel written only in a passive
 * effect stays stale for the commit that follows a rotation. Persisting the
 * value per hook instance reproduces that ordering.
 * @param initial - Initial value of the mutable.
 */
export const usePersistentSharedValue = (initial: number) => {
  const [holder] = useState(() => ({ value: initial }))

  return holder
}
