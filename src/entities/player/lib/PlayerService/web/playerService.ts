import { registerWebAudioElement } from 'audio-effects'
import { ctx } from 'shared/lib/reatom-ctx'
import { type PlaybackRate, setPlaybackRateAction } from '../../../playback-rate'
import { type LockScreenMetadata, type PlaybackStatus } from '../types'
import { attachWebAudioHandlers } from './audioHandlers'
import { resetWebDuration } from './durationWriter'
import { createPlayerControllers } from './playerControllers'
import { createPubSub } from './playerPubSub'
import { createWebPlayerState } from './playerState'
import { recoverStreamAfterReconnect as heal, resumeWebAfterPause } from './reconnectHeal'
import { createResumeSeekReassert, type ResumeSeekReassert } from './resumeSeekReassert'
import { createTrackElement } from './trackElement'
import { createVolumeControl } from './volumeControl'

export class WebPlayerService {
  public getState = () => this.state.getState()

  public subscribe = (listener: () => void) => this.pubsub.subscribe(listener)

  public getStatus = (): PlaybackStatus => this.state.getStatus()

  public applyVolume = (volume: number): void => this.volumeControl.apply(volume)

  public getVolume = (): number => this.volumeControl.get()

  public setVolume = async (volume: number): Promise<void> => this.volumeControl.apply(volume)

  public play = (): Promise<void> => this.controllers.transport.play()

  public pause = (): Promise<void> => this.controllers.transport.pause()

  public resumeAfterPause = (audioUrl: string): Promise<void> =>
    resumeWebAfterPause(this, this.audioInstance, audioUrl)

  public recoverStreamAfterReconnect = (audioUrl: string): Promise<void> =>
    this.audioInstance ? heal(this, audioUrl) : Promise.resolve()

  public reconcileOnForeground = async (): Promise<void> =>
    this.controllers.mediaSession.reassertMetadata()

  public setLockScreenMetadata = (metadata: LockScreenMetadata): void =>
    this.controllers.mediaSession.setMetadata(metadata)

  public reassertLockScreenMetadata = (metadata: LockScreenMetadata): void =>
    this.setLockScreenMetadata(metadata)

  public setPlaybackRate = async (rate: PlaybackRate): Promise<void> => {
    this.playbackRate = rate
    if (this.audioInstance) this.audioInstance.playbackRate = rate
    this.controllers.mediaSession.updatePositionState()
    void setPlaybackRateAction(ctx, rate)
  }

  public stop = (): Promise<void> => this.controllers.transport.stop()

  public seekTo = (newPositionMs: number): Promise<void> =>
    this.controllers.transport.seekTo(newPositionMs)

  public replaceAudio = async (audioUrl: string, initialPositionMs = 0) =>
    this.loadAudio(audioUrl, initialPositionMs)

  public loadAudio = async (audioUrl: string, initialPositionMs = 0) => {
    this.state.setIsBuffering(true)
    this.controllers.statusTracker.stop()
    resetWebDuration(this.state)
    this.controllers.resume.reset(initialPositionMs)
    this.resumeReassert = createResumeSeekReassert(
      initialPositionMs,
      this.state,
      this.controllers.mediaSession,
    )

    if (this.audioInstance) {
      this.detachAudioEvents?.()
      this.audioInstance.pause()
    }

    this.audioInstance = createTrackElement(audioUrl, this.playbackRate, this.volumeControl.get())
    this.detachAudioEvents = attachWebAudioHandlers({
      audio: this.audioInstance,
      flushProgressAtCurrentTime: this.controllers.resumeController.flushProgressAtCurrentTime,
      initialPositionMs,
      isCurrentAudio: current => current === this.audioInstance,
      mediaSession: this.controllers.mediaSession,
      noteLivePosition: this.controllers.resume.noteLivePosition,
      restoreInterruptedPosition: this.controllers.resume.maybeRestore,
      resumeSeekReassert: this.resumeReassert,
      startStatusTracker: this.controllers.statusTracker.start,
      state: this.state,
      stopStatusTracker: this.controllers.statusTracker.stop,
    })
    return null
  }

  public unload = async () => {
    this.controllers.resumeController.flushProgressAtCurrentTime()
    this.controllers.statusTracker.stop()
    this.detachAudioEvents?.()
    this.detachAudioEvents = null
    this.audioInstance?.pause()
    this.audioInstance = null
    registerWebAudioElement(null)
    this.controllers.resume.reset(0)
    this.controllers.mediaSession.clear()
  }

  private resumeReassert: ResumeSeekReassert = () => {}
  private audioInstance: HTMLAudioElement | null = null
  private detachAudioEvents: (() => void) | null = null
  private playbackRate: PlaybackRate = 1
  private volumeControl = createVolumeControl(() => this.audioInstance)
  private pubsub = createPubSub()
  private state = createWebPlayerState(this.pubsub)
  private controllers = createPlayerControllers({
    getAudio: () => this.audioInstance,
    getReconcile: () => this.resumeReassert,
    state: this.state,
  })
}
