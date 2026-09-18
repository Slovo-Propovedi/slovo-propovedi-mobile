import { ctx } from 'shared/lib/reatom-ctx'
import type { LockScreenMetadata } from '../types'
import { type PlaybackRate, setPlaybackRateAction } from '../../../playback-rate'
import { scheduleHistoryFlush } from '../progressFlusher'
import { createWebAudioElement } from './audioElement'
import { attachWebAudioHandlers, reportPlayError } from './audioHandlers'
import { resetWebDuration } from './durationWriter'
import { createInterruptionResumeController } from './interruptionResumeController'
import { createWebMediaSession } from './mediaSession'
import { createPubSub } from './playerPubSub'
import { createWebPlayerState } from './playerState'
import { createStatusTracker } from './playerStatusTracker'
import { recoverStreamAfterReconnect as healStreamAfterReconnect } from './reconnectHeal'

export class WebPlayerService {
  public getState = () => this.state.getState()
  public subscribe = (listener: () => void) => this.pubsub.subscribe(listener)

  public play = async () => {
    if (this.audioInstance) this.resume.maybeRestore(this.audioInstance)
    this.audioInstance?.play().catch(reportPlayError)
    this.statusTracker.start()
  }
  public pause = async () => {
    if (this.audioInstance) this.audioInstance.pause()
    this.resumeController.flushProgressAtCurrentTime()
    this.statusTracker.stop()
    this.state.setIsPlaying(false)
  }

  // Web source-swap on resume is not implemented (see docs/debt.md)
  public resumeAfterPause = async (): Promise<void> => this.play()

  public recoverStreamAfterReconnect = (audioUrl: string): Promise<void> =>
    this.audioInstance ? healStreamAfterReconnect(this, audioUrl) : Promise.resolve()

  public setLockScreenMetadata = (metadata: LockScreenMetadata): void => {
    this.mediaSession.setMetadata(metadata)
  }

  public reassertLockScreenMetadata = (metadata: LockScreenMetadata): void =>
    this.setLockScreenMetadata(metadata)

  public setPlaybackRate = async (rate: PlaybackRate): Promise<void> => {
    this.playbackRate = rate
    if (this.audioInstance) this.audioInstance.playbackRate = rate
    this.mediaSession.updatePositionState()
    void setPlaybackRateAction(ctx, rate)
  }

  public stop = async () => {
    this.resumeController.flushProgressAtCurrentTime()
    this.audioInstance?.pause()
    if (this.audioInstance) this.audioInstance.currentTime = 0
    this.resume.reset(0)
    this.statusTracker.stop()
    this.state.setIsPlaying(false)
  }

  public seekTo = async (newPositionMs: number) => {
    const clampedPositionMs = Math.max(0, newPositionMs)
    this.resume.noteExplicitPosition(clampedPositionMs)
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
    this.resume.reset(initialPositionMs)

    if (this.audioInstance) {
      this.detachAudioEvents?.()
      this.audioInstance.pause()
    }

    this.audioInstance = createWebAudioElement(audioUrl, this.playbackRate)
    this.detachAudioEvents = attachWebAudioHandlers({
      audio: this.audioInstance,
      flushProgressAtCurrentTime: this.resumeController.flushProgressAtCurrentTime,
      initialPositionMs,
      isCurrentAudio: current => current === this.audioInstance,
      mediaSession: this.mediaSession,
      noteLivePosition: this.resume.noteLivePosition,
      onTrackEnd: this.onTrackEnd,
      restoreInterruptedPosition: this.resume.maybeRestore,
      startStatusTracker: this.statusTracker.start,
      state: this.state,
      stopStatusTracker: this.statusTracker.stop,
    })
    return null
  }

  public unload = async () => {
    this.resumeController.flushProgressAtCurrentTime()
    this.statusTracker.stop()
    this.detachAudioEvents?.()
    this.detachAudioEvents = null
    this.audioInstance?.pause()
    this.audioInstance = null
    this.resume.reset(0)
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
  private resumeController = createInterruptionResumeController({
    getAudio: () => this.audioInstance,
    mediaSession: this.mediaSession,
    state: this.state,
  })
  private resume = this.resumeController.resume
}
