import {
  getResumePosition,
  historyAtom,
  recordSermonSwitchAction,
} from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import type { PlayerActions } from './types'
import { setCurrentAudioAction } from '../../../model'
import { savePlaybackProgress } from '../../playbackProgress'
import { lockScreenControls } from '../LockScreenControls'
import { getFirstTrack } from './navigation'

export interface OldTrackFlush {
  oldDurationMs: number
  oldPositionMs: number
  oldSermonId: string
}

/**
 * Plays a track after the previous one finished. The finished track's history
 * entry is flushed as completed and the new track's start recorded in one
 * atomic read-modify-write (recordSermonSwitchAction with markOldCompleted).
 * @param playerActions - Player control actions.
 * @param audio - New audio to play.
 * @param playlist - Playlist containing the new audio.
 * @param audioUrl - URL of the new audio file.
 * @param initialPositionMs - Position to start the new audio at.
 * @param oldFlush - Snapshot of the finished track taken before playback advanced.
 */
export const playTrackWithMetadata = async (
  playerActions: PlayerActions,
  audio: AudioPlayerData,
  playlist: PlaylistData,
  audioUrl: string,
  initialPositionMs = 0,
  oldFlush: OldTrackFlush,
): Promise<void> => {
  await savePlaybackProgress(ctx, { positionMs: initialPositionMs, sermonId: audio.id })

  void recordSermonSwitchAction(ctx, {
    markOldCompleted: true,
    newAudio: audio,
    newPlaylist: playlist,
    ...oldFlush,
  })

  const playerInstance = await playerActions.replaceAudio(audioUrl, initialPositionMs)
  await playWithAppStateHandling(playerActions)
  lockScreenControls.setMetadata(playerInstance, {
    albumTitle: playlist.title,
    artist: audio.artist,
    artworkUrl: audio.artwork,
    title: audio.title,
  })
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
  oldFlush: OldTrackFlush,
): Promise<void> => {
  const newAudio: AudioPlayerData = { ...audio, artwork: playlist.artwork }
  await setCurrentAudioAction(ctx, newAudio)
  await playTrackWithMetadata(playerActions, newAudio, playlist, audioUrl, 0, oldFlush)
}

export const playNextTrack = async (
  playerActions: PlayerActions,
  nextTrack: AudioPlayerData,
  playlist: PlaylistData,
  audioUrl: string,
  oldFlush: OldTrackFlush,
): Promise<void> => {
  const newAudio: AudioPlayerData = { ...nextTrack, artwork: playlist.artwork, audioUrl }
  await setCurrentAudioAction(ctx, newAudio)
  const history = ctx.get(historyAtom)
  const resumeMs = getResumePosition(history, nextTrack.id)
  await playTrackWithMetadata(playerActions, newAudio, playlist, audioUrl, resumeMs, oldFlush)
}

export const playFirstTrackInQueue = async (
  playerActions: PlayerActions,
  playlist: PlaylistData,
  oldFlush: OldTrackFlush,
): Promise<void> => {
  const firstTrack = getFirstTrack(playlist)
  if (!firstTrack) return

  const newAudio: AudioPlayerData = { ...firstTrack, artwork: playlist.artwork }
  await setCurrentAudioAction(ctx, newAudio)
  const history = ctx.get(historyAtom)
  const resumeMs = getResumePosition(history, firstTrack.id)
  await playTrackWithMetadata(
    playerActions,
    newAudio,
    playlist,
    firstTrack.audioUrl,
    resumeMs,
    oldFlush,
  )
}
