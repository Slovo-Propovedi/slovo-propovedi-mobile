import { type AudioPlayerData, type PlaylistData, toAudioPlayerData } from 'shared/model'
import { RepeatMode } from '../../../model'

export const findCurrentTrackIndex = (
  currentAudioId: string | undefined,
  sermons: PlaylistData['sermons'],
): number => sermons.findIndex(t => t.id === currentAudioId)

export const isLastTrackInPlaylist = (currentIndex: number, totalTracks: number): boolean =>
  currentIndex === totalTracks - 1

export const getNextTrack = (
  playlist: PlaylistData,
  currentIndex: number,
): AudioPlayerData | null => toAudioPlayerData(playlist.sermons[currentIndex + 1])

export const getFirstTrack = (playlist: PlaylistData): AudioPlayerData | null =>
  toAudioPlayerData(playlist.sermons[0])

export const shouldRepeatTrack = (repeatMode: RepeatMode): boolean =>
  repeatMode === RepeatMode.Track

export const shouldRestartQueue = (repeatMode: RepeatMode, isLastTrack: boolean): boolean =>
  repeatMode === RepeatMode.Queue && isLastTrack
