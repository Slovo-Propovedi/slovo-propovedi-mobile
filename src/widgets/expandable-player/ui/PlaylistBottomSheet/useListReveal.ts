import { useCallback, useEffect, useRef, useState } from 'react'

const REVEAL_CEILING_MS = 1500
// Row ≈ 50px art + paddings + separator — estimate for the upfront decision.
const ROW_HEIGHT_ESTIMATE_PX = 70
// Offsets up to ~3-4 rows: the correction scroll is tiny, no gate needed.
const IMMEDIATE_REVEAL_MAX_OFFSET_PX = 240

interface UseListRevealParams {
  currentIndex: number
}

// Near-top targets need no reveal gate — and no correction scroll: the target
// is already visible at open (issue #48), so skip the tiny jump entirely.
export const isOffsetNegligible = (index: number) =>
  index * ROW_HEIGHT_ESTIMATE_PX <= IMMEDIATE_REVEAL_MAX_OFFSET_PX

// Reveal gate for the playlist sheet: keep the list invisible until the
// auto-scroll has landed, so the entrance spring never flashes the list at
// offset 0. A ceiling timer force-reveals even if no scroll event ever fires.
export const useListReveal = ({ currentIndex }: UseListRevealParams) => {
  const [isRevealed, setIsRevealed] = useState(
    currentIndex <= 0 || isOffsetNegligible(currentIndex),
  )
  const isRevealedRef = useRef(isRevealed)
  const ceilingTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  const clearCeilingTimer = useCallback(() => {
    if (ceilingTimerRef.current === null) return
    clearTimeout(ceilingTimerRef.current)
    ceilingTimerRef.current = null
  }, [])

  const reveal = useCallback(() => {
    clearCeilingTimer()
    if (isRevealedRef.current) return
    isRevealedRef.current = true
    setIsRevealed(true)
  }, [clearCeilingTimer])

  const noteScrollScheduled = useCallback(() => {
    if (currentIndex <= 0 || isOffsetNegligible(currentIndex)) return
    if (isRevealedRef.current) return
    clearCeilingTimer()
    ceilingTimerRef.current = setTimeout(reveal, REVEAL_CEILING_MS)
  }, [currentIndex, clearCeilingTimer, reveal])

  const handleListScroll = useCallback(
    (y: number) => {
      // Any real scroll offset means the list is interactive/landed. The old
      // 100px threshold was unreachable for short playlists whose whole
      // scrollable distance is ~1 row (~73px) — the list stayed skeleton'd
      // until the ceiling timer (issue #69).
      if (y > 0) reveal()
    },
    [reveal],
  )

  useEffect(() => clearCeilingTimer, [clearCeilingTimer])

  return { handleListScroll, isRevealed, noteScrollScheduled }
}
