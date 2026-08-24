import { type AudioPlayerData, toAudioPlayerData } from 'shared/model'
import { type ListeningHistoryEntry } from '../model/types'

export const getEntrySermon = (entry: ListeningHistoryEntry): AudioPlayerData | null =>
  entry.sermon ?? toAudioPlayerData(entry.playlist.sermons[0])
