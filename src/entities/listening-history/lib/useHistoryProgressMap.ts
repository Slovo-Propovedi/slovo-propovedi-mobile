import { useAtom } from '@reatom/npm-react'
import { useMemo } from 'react'
import { historyAtom } from '../model/history'
import { isEntryCompleted } from './isEntryCompleted'

/**
 * Returns a Map of sermonId → progress (0..1) derived from listening history.
 *
 * Rules per entry:
 * - Skip if positionMs <= 0 OR durationMs <= 0.
 * - Completed entries → 1.
 * - Otherwise → positionMs / durationMs clamped to ≤1.
 */
export const useHistoryProgressMap = (): Map<string, number> => {
  const [entries] = useAtom(historyAtom)

  return useMemo(() => {
    const map = new Map<string, number>()

    for (const entry of entries) {
      const { durationMs, positionMs, sermon } = entry

      if (positionMs <= 0 || durationMs <= 0) continue

      if (isEntryCompleted(entry)) map.set(sermon.id, 1)
      else map.set(sermon.id, Math.min(positionMs / durationMs, 1))
    }

    return map
  }, [entries])
}
