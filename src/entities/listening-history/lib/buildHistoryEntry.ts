import { type AudioPlayerData } from 'entities/player'
import { type PlaylistData } from 'shared/model'
import { type ListeningHistoryEntry } from '../model/types'

const buildSanitizedSermon = (audio: AudioPlayerData) => {
  const { playlists: _playlists, ...rest } = audio
  return rest
}

const buildContextPlaylist = (
  playlist: PlaylistData,
  sanitizedSermon: ReturnType<typeof buildSanitizedSermon>,
): PlaylistData => ({
  artwork: playlist.artwork,
  description: playlist.description,
  id: playlist.id,
  sermons: [sanitizedSermon],
  title: playlist.title,
})

export const buildHistoryEntry = (
  audio: AudioPlayerData,
  playlist: PlaylistData,
  now: number,
): ListeningHistoryEntry => {
  const sanitizedSermon = buildSanitizedSermon(audio)

  return {
    durationMs: 0,
    lastPlayedAt: now,
    playlist: buildContextPlaylist(playlist, sanitizedSermon),
    positionMs: 0,
  }
}
