import { useAtom } from '@reatom/npm-react'
import { type AudioPlayerData } from 'shared/model'
import { historyAtom, isHistoryLoadedAtom } from '../model/history'
import { type ListeningHistoryEntry } from '../model/types'
import { getEntrySermon } from './getEntrySermon'

export interface LastListeningEntry {
  entry: ListeningHistoryEntry | null
  isLoaded: boolean
  sermon: AudioPlayerData | null
}

export const useLastListeningEntry = (): LastListeningEntry => {
  const [isLoaded] = useAtom(isHistoryLoadedAtom)
  const [history] = useAtom(historyAtom)

  if (!isLoaded) return { entry: null, isLoaded, sermon: null }

  for (const candidate of history) {
    const sermon = getEntrySermon(candidate)
    if (sermon) return { entry: candidate, isLoaded, sermon }
  }

  return { entry: null, isLoaded, sermon: null }
}
