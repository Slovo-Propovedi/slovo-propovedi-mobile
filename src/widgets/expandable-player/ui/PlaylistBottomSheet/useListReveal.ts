import { useCallback, useRef, useState } from 'react'
import { useDebounce } from 'shared/lib/hooks/useDebounce'

const REVEAL_CEILING_MS = 1500
// Row ≈ 50px art + paddings + separator — estimate for the upfront decision.
const ROW_HEIGHT_ESTIMATE_PX = 70
// Offsets up to ~3-4 rows: the correction scroll is tiny, no gate needed.
const IMMEDIATE_REVEAL_MAX_OFFSET_PX = 240
// The estimate jump (avg × index) may differ from the converged offset by a
// couple of rows; reveal once the list is within this band of the target.
const REVEAL_CONVERGENCE_TOLERANCE_PX = 160

interface UseListRevealParams {
  currentIndex: number
  hasPendingScroll: () => boolean
  intendedOffsetRef: React.RefObject<null | number>
}

// Near-top targets need no reveal gate — and no correction scroll: the target
// is already visible at open (issue #48), so skip the tiny jump entirely.
export const isOffsetNegligible = (index: number) =>
  index * ROW_HEIGHT_ESTIMATE_PX <= IMMEDIATE_REVEAL_MAX_OFFSET_PX

// Reveal gate for the playlist sheet: keep the list invisible until the
// auto-scroll has landed, so the entrance spring never flashes the list at
// offset 0. The estimate jump and each backoff retry stay masked by the
// skeleton: reveal fires only once the real offset is within tolerance of the
// intended target AND no retry is pending. A ceiling timer force-reveals even
// if no scroll event ever fires; a user drag/momentum reveals immediately.
export const useListReveal = ({
  currentIndex,
  hasPendingScroll,
  intendedOffsetRef,
}: UseListRevealParams) => {
  const [isRevealed, setIsRevealed] = useState(
    currentIndex <= 0 || isOffsetNegligible(currentIndex),
  )
  const isRevealedRef = useRef(isRevealed)

  const reveal = useCallback(() => {
    if (isRevealedRef.current) return
    isRevealedRef.current = true
    setIsRevealed(true)
  }, [])

  // The ceiling: reveal even when no scroll event ever fires. useDebounce
  // restarts the window on every re-arm and drops the pending one on unmount.
  const revealWhenStalled = useDebounce(reveal, REVEAL_CEILING_MS)

  const revealNow = useCallback(() => {
    revealWhenStalled.clear()
    reveal()
  }, [reveal, revealWhenStalled])

  const noteScrollScheduled = useCallback(() => {
    if (currentIndex <= 0 || isOffsetNegligible(currentIndex)) return
    if (isRevealedRef.current) return
    revealWhenStalled()
  }, [currentIndex, revealWhenStalled])

  const handleListScroll = useCallback(
    (y: number) => {
      // Any real scroll offset means the list is interactive/landed. The old
      // 100px threshold was unreachable for short playlists whose whole
      // scrollable distance is ~1 row (~73px) — the list stayed skeleton'd
      // until the ceiling timer (issue #69).
      if (y <= 0) return
      const intendedOffset = intendedOffsetRef.current
      // No estimate path (scrollToIndex landed first try): the scroll event
      // fires at the converged offset — reveal immediately.
      if (intendedOffset === null) {
        revealNow()
        return
      }
      // Estimate path: keep the skeleton until the list converges to the
      // intended offset AND no retries are pending — the estimate jump and
      // each backoff retry stay masked until the landing is stable.
      if (Math.abs(y - intendedOffset) <= REVEAL_CONVERGENCE_TOLERANCE_PX && !hasPendingScroll())
        revealNow()
    },
    [hasPendingScroll, intendedOffsetRef, revealNow],
  )

  return { handleListScroll, isRevealed, noteScrollScheduled, revealNow }
}
