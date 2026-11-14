import { useEffect, useState } from 'react'

/** Fallback conceal deadline when `transitionEnd` never arrives (interrupted gesture). */
export const OVERLAY_CONCEAL_CAP_MS = 600

/**
 * Conceals the search overlay only after the covering detail screen finished its
 * push transition, so the overlay does not vanish before the new screen slides in.
 * The transition is marked optimistically before `router.push` and cleared by the
 * pushed screen on `transitionEnd`; a cap covers a missed end event. Leaving the
 * covered route shows the overlay immediately: the returned value is derived from
 * `isCovered`, so back needs no effect round-trip.
 * @param isCovered - A detail route currently sits above the search overlay.
 * @param isTransitioning - The covering screen's push transition is still running.
 */
export const useSearchOverlayConceal = (isCovered: boolean, isTransitioning: boolean): boolean => {
  const [isConcealed, setIsConcealed] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks-extra/no-direct-set-state-in-use-effect --
     The conceal is edge-driven UI state derived from the navigation transition, not
     renderable data: React has no effect-free way to schedule it after an edge. */
  useEffect(() => {
    if (!isCovered) {
      setIsConcealed(false)
      return
    }

    if (isTransitioning) {
      // A new push starts while an older detail page may already be concealed:
      // reveal the overlay again for the duration of this transition.
      setIsConcealed(false)
      const timer = setTimeout(() => setIsConcealed(true), OVERLAY_CONCEAL_CAP_MS)

      return () => clearTimeout(timer)
    }

    setIsConcealed(true)
  }, [isCovered, isTransitioning])
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks-extra/no-direct-set-state-in-use-effect -- end of the edge-driven conceal block */

  return isCovered && isConcealed
}
