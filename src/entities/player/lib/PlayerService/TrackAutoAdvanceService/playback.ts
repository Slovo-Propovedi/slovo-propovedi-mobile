import { ctx } from 'shared/lib/reatom-ctx'
import type { PlayerActions } from './types'
import type { AudioPlayerData } from '../../../ui/PlayerControls.types'
import type { PlaylistData } from 'shared/model'
import { setCurrentAudioAction } from '../../../model'
import { lockScreenControls } from '../LockScreenControls'
import { getFirstTrack } from './navigation'

export const playTrackWithMetadata = async (
  playerActions: PlayerActions,
  audio: AudioPlayerData,
  playlist: PlaylistData,
  audioUrl: string,
  initialPositionMs = 0,
): Promise<void> => {
  const playerInstance = await playerActions.replaceAudio(audioUrl, initialPositionMs)
  lockScreenControls.setMetadata(playerInstance, {
    albumTitle: playlist.title,
    artist: audio.artist,
    artworkUrl: audio.artwork,
    title: audio.title,
  })
  await playWithAppStateHandling(playerActions)
}

export const playWithAppStateHandling = async (playerActions: PlayerActions): Promise<void> => {
  try {
    await playerActions.play()
  } catch (error) {
    if (error instanceof Error && error.message.includes('activity is no longer available'))
      console.warn('[TrackAutoAdvanceService] Ignoring AppState-related error:', error.message)
    else throw error
  }
}

export const repeatCurrentTrack = async (
  playerActions: PlayerActions,
  audio: AudioPlayerData,
  playlist: PlaylistData,
  audioUrl: string,
): Promise<void> => {
  await setCurrentAudioAction(ctx, audio)
  await playTrackWithMetadata(playerActions, audio, playlist, audioUrl, 0)
}

export const playNextTrack = async (
  playerActions: PlayerActions,
  nextTrack: AudioPlayerData,
  playlist: PlaylistData,
  audioUrl: string,
): Promise<void> => {
  const newAudio: AudioPlayerData = { ...nextTrack, audioUrl }
  await setCurrentAudioAction(ctx, newAudio)
  await playTrackWithMetadata(playerActions, newAudio, playlist, audioUrl)
}

export const playFirstTrackInQueue = async (
  playerActions: PlayerActions,
  playlist: PlaylistData,
): Promise<void> => {
  const firstTrack = getFirstTrack(playlist)
  if (!firstTrack) return

  await setCurrentAudioAction(ctx, firstTrack)
  await playTrackWithMetadata(playerActions, firstTrack, playlist, firstTrack.audioUrl)
}
