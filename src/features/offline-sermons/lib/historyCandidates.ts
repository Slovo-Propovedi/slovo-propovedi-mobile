import { getEntrySermon, readHistory } from 'entities/listening-history'
import { type SermonCandidate } from '../model'

export const collectHistoryCandidates = async (): Promise<SermonCandidate[]> => {
  const entries = await readHistory()

  return entries.flatMap(entry => {
    const sermon = getEntrySermon(entry)
    if (!sermon) return []

    return [{ playlist: entry.playlist, sermon }]
  })
}
