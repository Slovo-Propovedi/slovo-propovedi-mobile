import { audioCacheService } from 'entities/offline-cache'
import { toAudioPlayerData } from 'entities/sermon'
import { type OfflineSermonItem } from '../model'
import { type MergedSermonCandidate } from './mergeSermonCandidates'

export const filterCachedSermons = async (
  pairs: MergedSermonCandidate[],
): Promise<OfflineSermonItem[]> => {
  const narrowed = pairs.flatMap(({ playlist, sermon }) => {
    const audio = toAudioPlayerData(sermon)
    return audio ? [{ playlist, sermon: audio }] : []
  })

  const cachedFlags = await Promise.all(
    narrowed.map(({ sermon }) => audioCacheService.isCached(sermon.audioUrl).catch(() => false)),
  )

  return narrowed.filter((_, index) => cachedFlags[index])
}
