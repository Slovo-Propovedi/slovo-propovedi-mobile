import type { AudioPlayerData } from '../../../ui/PlayerControls/PlayerControls.types'
import type { PlaylistData } from 'shared/model'
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
): AudioPlayerData | null => {
  const nextTrack = playlist.sermons[currentIndex + 1]
  if (!nextTrack?.audioUrl) return null
  return nextTrack as AudioPlayerData
}

export const getFirstTrack = (playlist: PlaylistData): AudioPlayerData | null => {
  const firstTrack = playlist.sermons[0]
  if (!firstTrack?.audioUrl || !firstTrack?.id || !firstTrack?.title) return null
  return firstTrack as AudioPlayerData
}

export const shouldRepeatTrack = (repeatMode: RepeatMode): boolean =>
  repeatMode === RepeatMode.Track

export const shouldRestartQueue = (repeatMode: RepeatMode, isLastTrack: boolean): boolean =>
  repeatMode === RepeatMode.Queue && isLastTrack
