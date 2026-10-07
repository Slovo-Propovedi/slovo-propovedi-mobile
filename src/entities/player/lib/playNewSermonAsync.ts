import { getResumePosition, historyAtom } from 'entities/listening-history/@x/player'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  durationAtom,
  isPlayingAtom,
  positionAtom,
} from '../model'
import { type PlayNewSermonDeps, type PlayNewSermonProps } from './playNewSermonTypes'
import { guardOfflinePlayback } from './playOfflineGuard'
import { startSermonPlayback } from './startSermonPlayback'
import { resetStartupAttempts } from './startupGuard'

export const playNewSermonAsync = async (
  { playlist, sermon: { artist, artwork, audioUrl, id, title, ...other } }: PlayNewSermonProps,
  deps: PlayNewSermonDeps,
) => {
  if (!audioUrl) return

  const sermonId = id

  const currentAudio = ctx.get(currentAudioAtom)
  const currentPlaylist = ctx.get(currentPlaylistAtom)
  const isSameSermon = currentAudio?.id === sermonId
  // A known, different playlist context is a real switch request; an unknown
  // current playlist keeps the Issue #99 no-op.
  const playlistChanged = currentPlaylist !== null && currentPlaylist.id !== playlist.id
  const isSameSermonPlaying = isSameSermon && ctx.get(isPlayingAtom)
  const isContextOnlySwitch = isSameSermonPlaying && playlistChanged

  // Issue #99: tapping the sermon that is already playing in the same playlist is a no-op.
  if (isSameSermonPlaying && !playlistChanged) return

  if (deps.isRepeatTapSuppressed(sermonId)) return

  deps.markPlayStarted(sermonId)

  try {
    if (await guardOfflinePlayback(audioUrl, deps.isOnline)) return
    const currentPosition = ctx.get(positionAtom)
    const currentDuration = ctx.get(durationAtom)
    const history = ctx.get(historyAtom)

    // Artwork rule: the sermon's own artwork wins, the playlist's is the fallback.
    const newAudio: AudioPlayerData = {
      ...other,
      artist,
      artwork: artwork ?? playlist.artwork,
      audioUrl,
      id: sermonId,
      title,
    }

    const oldAudio = currentAudio

    await deps.setCurrentAudio(newAudio)
    await deps.setCurrentPlaylist(playlist)

    if (oldAudio?.id && oldAudio.id !== sermonId)
      await deps.recordSermonSwitch({
        markOldCompleted: false,
        newAudio,
        newPlaylist: playlist,
        oldDurationMs: currentDuration,
        oldPositionMs: Math.max(0, currentPosition),
        oldSermonId: oldAudio.id,
      })

    // Same sermon already playing + different playlist: the context (artwork,
    // playlist/queue, lock screen) is swapped above and playback keeps running
    // from the current position — no restart, no re-play.
    await startSermonPlayback({
      currentPosition,
      history,
      isSameSermon,
      isSameSermonPlaying,
      newAudio,
      play: deps.play,
      replaceAudio: deps.replaceAudio,
      resumeAfterPause: deps.resumeAfterPause,
      resumeMs: getResumePosition(history, sermonId),
      seekTo: deps.seekTo,
      sermonId,
    })

    if (!oldAudio?.id || oldAudio.id === sermonId) void deps.recordPlaybackStart(newAudio, playlist)

    // A manual playback start proves the player works: clear a stuck startup
    // guard so the next cold start restores state again.
    void resetStartupAttempts().catch(error => {
      console.warn('[playNewSermon] failed to reset startup guard:', error)
    })

    const lockScreenMetadata = {
      albumTitle: playlist.title,
      artist: newAudio.artist,
      artworkUrl: newAudio.artwork,
      title: newAudio.title,
    }

    // A context-only switch keeps the same player instance, so an in-place
    // metadata update can be dropped (notably the artwork). Re-assert through
    // the full activation path so the notification/lock screen show the new art.
    if (isContextOnlySwitch) deps.reassertLockScreenMetadata(lockScreenMetadata)
    else deps.setLockScreenMetadata(lockScreenMetadata)
  } catch (error) {
    deps.clearSuppressionOnError(sermonId)
    throw error
  } finally {
    deps.markPlayFinished(sermonId)
  }
}
