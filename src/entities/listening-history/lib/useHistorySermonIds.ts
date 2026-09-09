import { useAtom } from '@reatom/npm-react'
import { useMemo } from 'react'
import { historyAtom } from '../model/historyAtom'
import { getEntrySermon } from './getEntrySermon'

/**
 * Returns a Set of sermonIds present in listening history.
 *
 * Reliable in-history check: unlike useHistoryProgressMap (which skips entries
 * with position/duration <= 0), every entry contributes its sermon id.
 */
export const useHistorySermonIds = (): Set<string> => {
  const [entries] = useAtom(historyAtom)

  return useMemo(() => {
    const ids = new Set<string>()

    for (const entry of entries) {
      const sermon = getEntrySermon(entry)
      if (sermon) ids.add(sermon.id)
    }

    return ids
  }, [entries])
}
