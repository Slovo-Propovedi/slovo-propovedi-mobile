import { registerWebAudioElement } from 'audio-effects'
import { ctx } from 'shared/lib/reatom-ctx'
import { type PlaybackRate, setPlaybackRateAction } from '../../../playback-rate'
import { type LockScreenMetadata, type PlaybackStatus } from '../types'
import { attachWebAudioHandlers } from './audioHandlers'
import { resetWebDuration } from './durationWriter'
import { createInterruptionResumeController } from './interruptionResumeController'
import { createWebMediaSession } from './mediaSession'
import { createPubSub } from './playerPubSub'
import { createWebPlayerState } from './playerState'
import { createStatusTracker } from './playerStatusTracker'
import { recoverStreamAfterReconnect as healStreamAfterReconnect } from './reconnectHeal'
import { createTrackElement } from './trackElement'
import { createTransport } from './transport'
import { createVolumeControl } from './volumeControl'

export class WebPlayerService {
  public getState = () => this.state.getState()

  public subscribe = (listener: () => void) => this.pubsub.subscribe(listener)

  public getStatus = (): PlaybackStatus => this.state.getStatus()

  public applyVolume = (volume: number): void => this.volumeControl.apply(volume)

  public getVolume = (): number => this.volumeControl.get()

  public setVolume = async (volume: number): Promise<void> => this.volumeControl.apply(volume)

  public play = (): Promise<void> => this.transport.play()

  public pause = (): Promise<void> => this.transport.pause()

  // Web source-swap on resume is not implemented (see docs/debt.md)
  public resumeAfterPause = async (): Promise<void> => this.play()

  public recoverStreamAfterReconnect = (audioUrl: string): Promise<void> =>
    this.audioInstance ? healStreamAfterReconnect(this, audioUrl) : Promise.resolve()

  public setLockScreenMetadata = (metadata: LockScreenMetadata): void =>
    this.mediaSession.setMetadata(metadata)

  public reassertLockScreenMetadata = (metadata: LockScreenMetadata): void =>
    this.setLockScreenMetadata(metadata)

  public setPlaybackRate = async (rate: PlaybackRate): Promise<void> => {
    this.playbackRate = rate
    if (this.audioInstance) this.audioInstance.playbackRate = rate
    this.mediaSession.updatePositionState()
    void setPlaybackRateAction(ctx, rate)
  }

  public stop = (): Promise<void> => this.transport.stop()

  public seekTo = (newPositionMs: number): Promise<void> => this.transport.seekTo(newPositionMs)

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

    this.audioInstance = createTrackElement(audioUrl, this.playbackRate, this.volumeControl.get())
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
    registerWebAudioElement(null)
    this.resume.reset(0)
    this.mediaSession.clear()
  }

  private audioInstance: HTMLAudioElement | null = null
  private detachAudioEvents: (() => void) | null = null
  private onTrackEnd: (() => void) | undefined = undefined
  private playbackRate: PlaybackRate = 1
  private volumeControl = createVolumeControl(() => this.audioInstance)
  private pubsub = createPubSub()
  private state = createWebPlayerState(this.pubsub)
  private statusTracker = createStatusTracker(() => this.audioInstance, this.state)
  private mediaSession = createWebMediaSession(
    {
      pause: () => this.transport.pause(),
      play: () => this.transport.play(),
      seekTo: positionMs => this.transport.seekTo(positionMs),
    },
    () => this.audioInstance,
  )
  private resumeController = createInterruptionResumeController({
    getAudio: () => this.audioInstance,
    mediaSession: this.mediaSession,
    state: this.state,
  })
  private resume = this.resumeController.resume
  private transport = createTransport({
    flushProgressAtCurrentTime: this.resumeController.flushProgressAtCurrentTime,
    getAudio: () => this.audioInstance,
    mediaSession: this.mediaSession,
    resume: this.resumeController.resume,
    state: this.state,
    statusTracker: this.statusTracker,
  })
}
