import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import type { LockScreenMetadata } from './types'
import type { PlaybackRate } from '../../playback-rate'
import { setPlaybackRateAction } from '../../playback-rate'
import { flushProgress, scheduleHistoryFlush } from './progressFlusher'
import { attachWebAudioHandlers } from './webAudioHandlers'
import { autoCacheOnPlay } from './webAutoCache'
import { resetWebDuration } from './webDurationWriter'
import { createWebMediaSession } from './webMediaSession'
import { createPubSub } from './webPlayerPubSub'
import { createWebPlayerState } from './webPlayerState'
import { createStatusTracker } from './webPlayerStatusTracker'
import { createWebStubControls } from './webPlayerStubControls'

class WebPlayerService {
  public getState = () => this.state.getState()

  public subscribe = (listener: () => void) => this.pubsub.subscribe(listener)

  public play = async () => {
    this.audioInstance?.play().catch(error => {
      console.error('[WebPlayerService] play failed:', error)
      reportError(error, 'Ошибка при воспроизведении аудио')
    })
    this.statusTracker.start()
  }

  public pause = async () => {
    if (this.audioInstance) this.audioInstance.pause()
    this.flushProgressAtCurrentTime()
    this.statusTracker.stop()
    this.state.setIsPlaying(false)
  }

  public setLockScreenMetadata = (metadata: LockScreenMetadata): void => {
    this.mediaSession.setMetadata(metadata)
  }

  public reassertLockScreenMetadata = (metadata: LockScreenMetadata): void =>
    this.setLockScreenMetadata(metadata)

  private flushProgressAtCurrentTime = (): void => {
    if (!this.audioInstance) return
    flushProgress(Math.floor(this.audioInstance.currentTime * 1000))
  }

  public setPlaybackRate = async (rate: PlaybackRate): Promise<void> => {
    this.playbackRate = rate
    if (this.audioInstance) this.audioInstance.playbackRate = rate
    this.mediaSession.updatePositionState()
    void setPlaybackRateAction(ctx, rate)
  }

  public stop = async () => {
    this.flushProgressAtCurrentTime()
    this.audioInstance?.pause()
    if (this.audioInstance) this.audioInstance.currentTime = 0
    this.statusTracker.stop()
    this.state.setIsPlaying(false)
  }

  public seekTo = async (newPositionMs: number) => {
    const clampedPositionMs = Math.max(0, newPositionMs)
    if (this.audioInstance) {
      this.audioInstance.currentTime = clampedPositionMs / 1000
      this.state.setPosition(clampedPositionMs)
    }
    this.mediaSession.updatePositionState()
    scheduleHistoryFlush(clampedPositionMs)
  }

  public replaceAudio = async (audioUrl: string, initialPositionMs = 0) =>
    this.loadAudio(audioUrl, initialPositionMs)

  public loadAudio = async (audioUrl: string, initialPositionMs = 0) => {
    this.state.setIsBuffering(true)
    this.statusTracker.stop()
    resetWebDuration(this.state)

    if (this.audioInstance) {
      this.detachAudioEvents?.()
      this.audioInstance.pause()
    }

    const audio = new Audio(audioUrl)
    this.audioInstance = audio

    if (this.playbackRate !== 1) audio.playbackRate = this.playbackRate

    autoCacheOnPlay(audioUrl)

    this.detachAudioEvents = attachWebAudioHandlers({
      audio,
      flushProgressAtCurrentTime: this.flushProgressAtCurrentTime,
      initialPositionMs,
      isCurrentAudio: current => current === this.audioInstance,
      mediaSession: this.mediaSession,
      onTrackEnd: this.onTrackEnd,
      state: this.state,
    })
    return null
  }

  public unload = async () => {
    this.flushProgressAtCurrentTime()
    this.statusTracker.stop()
    this.detachAudioEvents?.()
    this.detachAudioEvents = null
    this.audioInstance?.pause()
    this.audioInstance = null
    this.mediaSession.clear()
  }

  private audioInstance: HTMLAudioElement | null = null
  private detachAudioEvents: (() => void) | null = null
  private onTrackEnd: (() => void) | undefined = undefined
  private playbackRate: PlaybackRate = 1
  private pubsub = createPubSub()
  private state = createWebPlayerState(this.pubsub)
  private statusTracker = createStatusTracker(() => this.audioInstance, this.state)
  private mediaSession = createWebMediaSession(
    { pause: this.pause, play: this.play, seekTo: this.seekTo },
    () => this.audioInstance,
  )
}

const webPlayer = new WebPlayerService()
// Web fills for controls with no browser equivalent; lock-screen metadata handled by class-level MediaSession controller.
export const playerService = Object.assign(webPlayer, createWebStubControls(webPlayer.getState))
