import { buildManualPlaylist } from 'entities/listening-history'
import { type PlaylistData, type SermonData, toAudioPlayerData } from 'shared/model'
import { type SermonCandidate } from '../model'

export interface MergedSermonCandidate {
  playlist: PlaylistData
  sermon: SermonData
}

export const mergeSermonCandidates = (candidates: SermonCandidate[]): MergedSermonCandidate[] => {
  const byId = new Map<string, SermonCandidate>()

  for (const candidate of candidates) {
    const existing = byId.get(candidate.sermon.id)

    if (!existing) {
      byId.set(candidate.sermon.id, candidate)
      continue
    }

    if (!existing.playlist && candidate.playlist) byId.set(candidate.sermon.id, candidate)
  }

  return [...byId.values()].flatMap(({ playlist, sermon }) => {
    if (playlist) return [{ playlist, sermon }]

    const audio = toAudioPlayerData(sermon)
    return audio ? [{ playlist: buildManualPlaylist(audio), sermon }] : []
  })
}
