import { useAtom } from '@reatom/npm-react'
import { type AudioPlayerData } from 'shared/model'
import { historyAtom, isHistoryLoadedAtom } from '../model/historyAtom'
import { type ListeningHistoryEntry } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { isEntryCompleted } from './isEntryCompleted'

export interface LastListeningEntry {
  entry: ListeningHistoryEntry | null
  isLoaded: boolean
  sermon: AudioPlayerData | null
}

/**
 * Returns the first history entry that has a resolvable sermon AND is not completed.
 * Skips completed entries — there is nothing to "continue" for a finished track.
 * Returns null when all sermon-bearing entries are completed or history is empty.
 */
export const useLastListeningEntry = (): LastListeningEntry => {
  const [isLoaded] = useAtom(isHistoryLoadedAtom)
  const [history] = useAtom(historyAtom)

  if (!isLoaded) return { entry: null, isLoaded, sermon: null }

  for (const candidate of history) {
    const sermon = getEntrySermon(candidate)
    if (sermon && !isEntryCompleted(candidate)) return { entry: candidate, isLoaded, sermon }
  }

  return { entry: null, isLoaded, sermon: null }
}
