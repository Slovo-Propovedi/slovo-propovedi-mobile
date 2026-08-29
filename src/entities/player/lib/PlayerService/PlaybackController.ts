import { type AudioPlayer } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import {
  isSeekingAtom,
  setIsPlayingAction,
  setIsSeekingAction,
  setPositionAction,
  setSeekTargetAction,
  setVolumeAction,
} from '../../model'
import { type PlaybackRate } from '../../playback-rate'
import { setPlaybackRateAction } from '../../playback-rate'
import { flushProgress, scheduleHistoryFlush } from './progressFlusher'
import { type PlaybackStatus } from './types'

/** If no fresh position event arrives within this window, unblock the guard. */
const SEEK_SAFETY_TIMEOUT_MS = 2000

const DEFAULT_PLAYBACK_STATUS: PlaybackStatus = {
  duration: 0,
  isPlaying: false,
  position: 0,
}

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

    player.pause()
    await player.seekTo(0)
    void setIsPlayingAction(ctx, false)
  }

  public seekTo = async (player: AudioPlayer | null, positionMs: number): Promise<void> => {
    if (!player) return
    if (this.seekTimeoutId) clearTimeout(this.seekTimeoutId)

    const clampedPosition = Math.max(0, positionMs)
    void setIsSeekingAction(ctx, true)
    void setSeekTargetAction(ctx, clampedPosition)
    void setPositionAction(ctx, clampedPosition)
    scheduleHistoryFlush(clampedPosition)
    this.seekTimeoutId = setTimeout(() => {
      this.seekTimeoutId = null
      if (ctx.get(isSeekingAtom)) void setIsSeekingAction(ctx, false)
    }, SEEK_SAFETY_TIMEOUT_MS)
    try {
      await player.seekTo(clampedPosition / 1000)
    } catch (error) {
      console.error('[PlaybackController] seekTo failed:', error)
      reportError(error, 'Ошибка при перемотке аудио')
      if (this.seekTimeoutId) {
        clearTimeout(this.seekTimeoutId)
        this.seekTimeoutId = null
      }
      void setIsSeekingAction(ctx, false)
    }
  }

  public resetSeekGuard = (): void => {
    if (this.seekTimeoutId) {
      clearTimeout(this.seekTimeoutId)
      this.seekTimeoutId = null
    }
    void setIsSeekingAction(ctx, false)
    void setSeekTargetAction(ctx, null)
  }

  public setPlaybackRate = async (
    player: AudioPlayer | null,
    rate: PlaybackRate,
  ): Promise<void> => {
    this.playbackRate = rate
    player?.setPlaybackRate(rate, 'high')
    void setPlaybackRateAction(ctx, rate)
  }

  public setVolume = async (player: AudioPlayer | null, volume: number): Promise<void> => {
    this.volume = Math.max(0, Math.min(1, volume))

    if (player?.isLoaded) player.volume = this.volume

    void setVolumeAction(ctx, this.volume)
  }

  public applyPlaybackRate = (player: AudioPlayer | null): void => {
    if (this.playbackRate === 1) return
    player?.setPlaybackRate(this.playbackRate, 'high')
  }

  public getStatus = (player: AudioPlayer | null): PlaybackStatus => {
    if (!player?.isLoaded) return DEFAULT_PLAYBACK_STATUS

    return {
      duration: Math.floor(player.duration * 1000),
      isPlaying: player.playing,
      position: Math.floor(player.currentTime * 1000),
    }
  }

  public getPlaybackRate = (): PlaybackRate => this.playbackRate

  public getVolume = (): number => this.volume

  private playbackRate: PlaybackRate = 1
  private seekTimeoutId: null | ReturnType<typeof setTimeout> = null
  private volume = 1
}

export const playbackController = new PlaybackController()
