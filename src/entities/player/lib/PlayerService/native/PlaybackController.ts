import { type AudioPlayer } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import {
  setIsPlayingAction,
  setIsSeekingAction,
  setPositionAction,
  setSeekTargetAction,
} from '../../../model'
import { type PlaybackRate } from '../../../playback-rate'
import { flushProgress, scheduleHistoryFlush } from '../progressFlusher'
import { type PlaybackStatus, type SeekSourceSwap } from '../types'
import { audioEffectsAttach } from './audioEffectsAttach'
import { audioEffectsPreferences } from './audioEffectsPreferences'
import { playbackPreferences } from './playbackPreferences'
import { resolvePlaybackStatus } from './playbackStatus'
import { seekGuard } from './SeekGuard'
import { seekWithSourceSwap } from './seekViaPartialSource'

/**
 * PlaybackController handles core playback operations.
 * Works with an external player instance passed as parameter.
 */
class PlaybackController {
  public play = async (player: AudioPlayer | null): Promise<void> => {
    if (!player?.isLoaded) return

    player.play()
  }

  public pause = async (player: AudioPlayer | null): Promise<void> => {
    if (!player?.isLoaded) return

    const positionMs = Math.floor(player.currentTime * 1000)
    player.pause()
    void setIsPlayingAction(ctx, false)
    flushProgress(positionMs)
  }

  public stop = async (player: AudioPlayer | null): Promise<void> => {
    if (!player?.isLoaded) return

    const positionMs = Math.floor(player.currentTime * 1000)
    player.pause()
    try {
      await player.seekTo(0)
    } catch (error) {
      console.error('[PlaybackController] stop seekTo(0) failed:', error)
      reportError(error, 'Ошибка при сбросе позиции')
    }
    void setIsPlayingAction(ctx, false)
    flushProgress(positionMs)
  }

  public seekTo = async (
    player: AudioPlayer | null,
    positionMs: number,
    sourceSwap?: SeekSourceSwap,
  ): Promise<void> => {
    if (!player) return
    const clampedPosition = Math.max(0, positionMs)
    if (sourceSwap) {
      const swapped = await seekWithSourceSwap(sourceSwap, clampedPosition)
      if (swapped) return
    }
    seekGuard.arm()

    void setIsSeekingAction(ctx, true)
    void setSeekTargetAction(ctx, clampedPosition)
    void setPositionAction(ctx, clampedPosition)
    scheduleHistoryFlush(clampedPosition)
    try {
      await player.seekTo(clampedPosition / 1000)
    } catch (error) {
      console.error('[PlaybackController] seekTo failed:', error)
      reportError(error, 'Ошибка при перемотке аудио')
      seekGuard.clear()
      void setIsSeekingAction(ctx, false)
    }
  }

  public resetSeekGuard = (): void => {
    seekGuard.reset()
  }

  public setPlaybackRate = async (
    player: AudioPlayer | null,
    rate: PlaybackRate,
  ): Promise<void> => {
    playbackPreferences.setPlaybackRate(player, rate)
    // Rate changes reset pitch natively (expo-audio queues PlaybackParameters(
    // rate, 1f) on the main queue); re-assert ours with the same rate — the
    // native pitch setter is dispatched to that queue right after the rate
    // reset, so FIFO ordering makes PlaybackParameters(rate, pitch) win.
    audioEffectsPreferences.reassertPitch()
  }

  public setVolume = async (player: AudioPlayer | null, volume: number): Promise<void> => {
    playbackPreferences.setVolume(player, volume)
  }

  public applyVolume = (player: AudioPlayer | null, volume: number): void => {
    playbackPreferences.applyVolume(player, volume)
  }

  public applyPreferences = (player: AudioPlayer | null): void => {
    this.applyPlaybackRate(player)
    this.reassertVolume(player)
    // Attach last: rate application resets pitch, attach re-applies the stored one.
    audioEffectsAttach.attach(audioEffectsPreferences, player)
  }

  public applyPlaybackRate = (player: AudioPlayer | null): void => {
    playbackPreferences.applyPlaybackRate(player)
  }

  public reassertVolume = (player: AudioPlayer | null): void => {
    playbackPreferences.reassertVolume(player)
  }

  public getStatus = (player: AudioPlayer | null): PlaybackStatus => resolvePlaybackStatus(player)

  public getPlaybackRate = (): PlaybackRate => playbackPreferences.getPlaybackRate()

  public getVolume = (): number => playbackPreferences.getVolume()
}

export const playbackController = new PlaybackController()
