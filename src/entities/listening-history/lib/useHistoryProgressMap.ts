import { useAtom } from '@reatom/npm-react'
import { useMemo } from 'react'
import { historyAtom } from '../model/historyAtom'
import { sermonProgressAtom } from '../model/progressAtom'
import { getEntrySermon } from './getEntrySermon'
import { isEntryCompleted } from './isEntryCompleted'

const toProgress = (positionMs: number, durationMs: number): number =>
  isEntryCompleted({ durationMs, positionMs }) ? 1 : Math.min(positionMs / durationMs, 1)

/**
 * Returns a Map of sermonId → progress (0..1) merged from the per-sermon
 * progress store and the listening history catalog.
 *
 * The progress store carries EVERY listened sermon — including ones evicted
 * from the capped (100 entries) catalog — so it is the base layer. Catalog
 * entries are overlaid on top: both are written in the same commit, so a
 * conflict is practically impossible, but the catalog is the fresher source.
 *
 * Rules per source record:
 * - Skip if positionMs <= 0 OR durationMs <= 0.
 * - Completed records → 1.
 * - Otherwise → positionMs / durationMs clamped to ≤1.
 */
export const useHistoryProgressMap = (): Map<string, number> => {
  const [entries] = useAtom(historyAtom)
  const [progressRecords] = useAtom(sermonProgressAtom)

  return useMemo(() => {
    const map = new Map<string, number>()

    for (const [sermonId, record] of Object.entries(progressRecords)) {
      if (record.positionMs <= 0 || record.durationMs <= 0) continue
      map.set(sermonId, toProgress(record.positionMs, record.durationMs))
    }

    for (const entry of entries) {
      const { durationMs, positionMs } = entry

      if (positionMs <= 0 || durationMs <= 0) continue

      const sermon = getEntrySermon(entry)
      if (!sermon) continue

      map.set(sermon.id, toProgress(positionMs, durationMs))
    }

    return map
  }, [entries, progressRecords])
}
