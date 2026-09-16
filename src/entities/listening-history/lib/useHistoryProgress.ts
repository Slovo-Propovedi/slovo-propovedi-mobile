import { useCtx } from '@reatom/npm-react'
import { useEffect, useState } from 'react'
import { historyAtom } from '../model/historyAtom'
import { getEntrySermon } from './getEntrySermon'
import { isEntryCompleted } from './isEntryCompleted'

/**
 * Narrow per-row progress read: subscribes to historyAtom and returns the
 * stored progress (0..1) for a single sermon id, or undefined when the sermon
 * has no usable history entry. The Object.is bailout keeps unrelated rows from
 * re-rendering when history changes (pattern: useTrackItemCache).
 * @param sermonId - The sermon id to look up in listening history.
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
      let next: number | undefined
      if (historyEntry && historyEntry.positionMs > 0 && historyEntry.durationMs > 0)
        next = isEntryCompleted(historyEntry)
          ? 1
          : Math.min(historyEntry.positionMs / historyEntry.durationMs, 1)

      setProgress(prev => (prev === next ? prev : next))
    }
    readProgress()
    return ctx.subscribe(historyAtom, readProgress)
  }, [ctx, sermonId])

  return progress
}
