import { useCtx } from '@reatom/npm-react'
import { useEffect, useState } from 'react'
import { historyAtom } from '../model/historyAtom'
import { sermonProgressAtom } from '../model/progressAtom'
import { getEntrySermon } from './getEntrySermon'
import { isEntryCompleted } from './isEntryCompleted'

const toProgress = (positionMs: number, durationMs: number): number =>
  isEntryCompleted({ durationMs, positionMs }) ? 1 : Math.min(positionMs / durationMs, 1)

/**
 * Narrow per-row progress read: subscribes to both progress carriers and
 * returns the stored progress (0..1) for a single sermon id, or undefined when
 * the sermon has no usable record. The catalog entry wins when both exist
 * (same commit writes both); the per-sermon progress store is the fallback that
 * keeps the indication for sermons evicted from the capped catalog. The
 * Object.is bailout keeps unrelated rows from re-rendering when the carriers
 * change (pattern: useTrackItemCache).
 * @param sermonId - The sermon id to look up.
 */
export const useHistoryProgress = (sermonId: string | undefined): number | undefined => {
  const ctx = useCtx()
  const [progress, setProgress] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!sermonId) return
    const readProgress = () => {
      const historyEntry = ctx
        .get(historyAtom)
        .find(entry => getEntrySermon(entry)?.id === sermonId)
      const progressRecord = ctx.get(sermonProgressAtom)[sermonId]
      // Каталог приоритетнее: обе записи пишутся одним коммитом.
      const source =
        historyEntry && historyEntry.positionMs > 0 && historyEntry.durationMs > 0
          ? historyEntry
          : progressRecord && progressRecord.positionMs > 0 && progressRecord.durationMs > 0
            ? progressRecord
            : undefined

      const next = source ? toProgress(source.positionMs, source.durationMs) : undefined
      setProgress(prev => (prev === next ? prev : next))
    }
    readProgress()
    // Подписка на sermonProgressAtom обязательна: коммит каталога обновляет
    // и его, а вытесненные из каталога записи живут только в нём.
    const unsubHistory = ctx.subscribe(historyAtom, readProgress)
    const unsubProgress = ctx.subscribe(sermonProgressAtom, readProgress)
    return () => {
      unsubHistory()
      unsubProgress()
    }
  }, [ctx, sermonId])

  return progress
}
