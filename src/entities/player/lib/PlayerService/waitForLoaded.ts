import AsyncStorage from '@react-native-async-storage/async-storage'
import { CURRENT_SOUND_DURATION } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import type { AudioPlayer } from 'expo-audio'
import { setDurationAction, setIsBufferingAction, setPositionAction } from '../../model'

const LOAD_TIMEOUT_MS = 30000
const STALE_POLL_TOLERANCE_MS = 1500

/**
 * Event-driven wait for AudioPlayer to become loaded.
 * Works in background where JS timers freeze — events ARE delivered natively.
 * Seeks to initialPositionMs only when meaningful (non-zero, position still fresh).
 * @param player - The audio player instance to wait on.
 * @param initialPositionMs - Target position in milliseconds to seek to after load.
 * @param isCurrentPlayer - Guard: returns true if the player is still the active one
 *   (avoids stale writes when a newer load supersedes or releaseAndReset runs).
 */
export const waitForLoaded = (
  player: AudioPlayer,
  initialPositionMs: number,
  isCurrentPlayer: (p: AudioPlayer) => boolean,
): Promise<AudioPlayer | null> => {
  // Sync fast-path: already loaded — no listeners, no timers, immediate resolution.
  if (player.isLoaded) return completeLoad(player, initialPositionMs, isCurrentPlayer)

  return new Promise<AudioPlayer | null>(resolve => {
    let resolved = false

    const finish = (result: AudioPlayer | null) => {
      if (resolved) return
      resolved = true
      clearTimeout(timeout)
      subscription.remove()
      if (result) void completeLoad(result, initialPositionMs, isCurrentPlayer).then(resolve)
      else {
        // Stale: skip clear-buffering — do not touch global state from a superseded wait
        if (isCurrentPlayer(player)) void setIsBufferingAction(ctx, false)
        resolve(null)
      }
    }

    // Primary path: event-driven (works in background — native events delivered even when timers frozen)
    const subscription = player.addListener('playbackStatusUpdate', status => {
      // Error fast-fail: do not hang 30s on an error status
      if ('error' in status && status.error) {
        finish(null)
        return
      }
      if (status.isLoaded) finish(player)
    })

    // Safety-net: timeout fallback for foreground stalls (timers freeze in background — that's fine)
    const timeout = setTimeout(() => {
      finish(null)
    }, LOAD_TIMEOUT_MS)
  })
}

const completeLoad = (
  player: AudioPlayer,
  initialPositionMs: number,
  isCurrentPlayer: (p: AudioPlayer) => boolean,
): Promise<AudioPlayer> => {
  if (!isCurrentPlayer(player)) return Promise.resolve(player)

  const dur = Math.floor(player.duration * 1000)
  void setDurationAction(ctx, dur)
  void AsyncStorage.setItem(CURRENT_SOUND_DURATION, String(dur))
  void setIsBufferingAction(ctx, false)

  // currentMs is read from the sync player.currentTime getter (proven in production);
  // do NOT switch to event payload without deliberate intent.
  const currentMs = Math.floor(player.currentTime * 1000)
  const shouldSeek =
    initialPositionMs > 0 && currentMs <= initialPositionMs + STALE_POLL_TOLERANCE_MS

  // Position semantics: set position whenever the stale-progress guard passes.
  // Restores old reset-to-0-immediately on auto-advance (initial=0, fresh source → position 0)
  // and never yanks a progressed position backwards.
  if (currentMs <= initialPositionMs + STALE_POLL_TOLERANCE_MS)
    void setPositionAction(ctx, initialPositionMs)

  const clampedMs = initialPositionMs > dur ? dur : initialPositionMs

  if (shouldSeek)
    player.seekTo(clampedMs / 1000).catch(error => {
      console.error('[AudioLoader] waitForLoaded: initial seekTo failed:', error)
      reportError(error, 'Ошибка при перемотке к сохранённой позиции')
    })

  return Promise.resolve(player)
}
