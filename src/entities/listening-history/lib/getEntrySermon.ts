import { type AudioPlayerData } from 'entities/player'
import { type ListeningHistoryEntry } from '../model/types'

export const getEntrySermon = (entry: ListeningHistoryEntry): AudioPlayerData =>
  (entry.sermon ?? entry.playlist.sermons[0]) as AudioPlayerData
