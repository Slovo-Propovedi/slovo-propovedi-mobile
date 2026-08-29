import { ctx } from 'shared/lib/reatom-ctx'
import type { LockScreenMetadata } from './types'
import type { PlaybackRate } from '../../playback-rate'
import type { AudioPlayer } from 'expo-audio'
import {
  setDurationAction,
  setIsBufferingAction,
  setPauseTypeAction,
  setPositionAction,
} from '../../model'
import { audioLoader } from './AudioLoader'
import { audioModeManager } from './AudioModeManager'
import { lockScreenControls } from './LockScreenControls'
import { createAudioInterruptionHandler, setupPlayerListeners } from './nativePlayerHelpers'
import { playbackController } from './PlaybackController'
import { playerStatusListener } from './PlayerStatusListener'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService/TrackAutoAdvanceService'

export class PlayerService {
  public getStatus = () => playbackController.getStatus(this.playerInstance)

  public getVolume = () => playbackController.getVolume()

  public loadAudio = async (
    audioUrl: string,
    initialPositionMs = 0,
  ): Promise<AudioPlayer | null> => {
    if (!audioUrl) return null
    void setIsBufferingAction(ctx, true)
    void setPositionAction(ctx, 0)
    await audioModeManager.configure()

    const player = await audioLoader.loadAudio(audioUrl, initialPositionMs)
    if (!player) {
      void setIsBufferingAction(ctx, false)
      return null
    }

    this.playerInstance = player
    playbackController.applyPlaybackRate(player)
    this.setupListeners()
    return player
  }

  public pause = async (pauseType?: 'auto'): Promise<void> => {
    if (pauseType === 'auto') void setPauseTypeAction(ctx, 'auto')
    await playbackController.pause(this.playerInstance)
  }

  public play = async (): Promise<void> => {
    await playbackController.play(this.playerInstance)
  }

  public replaceAudio = async (
    audioUrl: string,
    initialPositionMs = 0,
  ): Promise<AudioPlayer | null> => {
    if (!audioUrl) return null
    void setDurationAction(ctx, 0)
    playbackController.resetSeekGuard()
    playerStatusListener.cleanup()

    // Replace-in-place strategy: the same AudioPlayer (and thus the same MediaSession,
    // foreground service and notification ID) survives the track switch. Tearing down
    // the lock-screen session here stopped the Android foreground service mid-transition,
    // freezing background auto-advance (issue #50) and orphaning duplicate notifications.
    await audioModeManager.configure()

    const player = await audioLoader.replaceAudio(audioUrl, initialPositionMs)
    if (player) this.playerInstance = player
    playbackController.applyPlaybackRate(this.playerInstance)
    this.setupListeners()
    return player
  }

  public seekTo = async (newPositionMs: number): Promise<void> => {
    await playbackController.seekTo(this.playerInstance, newPositionMs)
  }

  public setLockScreenMetadata = (metadata: LockScreenMetadata): void => {
    lockScreenControls.setMetadata(this.playerInstance, metadata)
  }

  public reassertLockScreenMetadata = (metadata: LockScreenMetadata): void => {
    lockScreenControls.reassertMetadata(this.playerInstance, metadata)
  }

  public setPlaybackRate = async (rate: PlaybackRate): Promise<void> => {
    await playbackController.setPlaybackRate(this.playerInstance, rate)
  }

  public setVolume = async (newVolume: number): Promise<void> => {
    await playbackController.setVolume(this.playerInstance, newVolume)
  }

  public stop = async (): Promise<void> => {
    await playbackController.stop(this.playerInstance)
  }

  public unload = async (): Promise<void> => {
    // No lockScreenControls.clear() here: release() while the session is still
    // active removes the notification natively and reliably, while deactivating
    // first can silently no-op mid-BINDING and orphan a duplicate notification.
    playerStatusListener.cleanup()
    audioLoader.releaseAndReset()
    this.playerInstance = null
  }

  private setupListeners = (): void => {
    if (!this.playerInstance) return
    setupPlayerListeners(this.playerInstance, this.handleAudioInterruption)
  }

  private handleAudioInterruption = createAudioInterruptionHandler({
    pause: (...args) => this.pause(...args),
    play: () => this.play(),
  })

  private playerInstance: AudioPlayer | null = null
}

export const playerService = new PlayerService()

trackAutoAdvanceService.setPlayerActions({
  pause: () => playerService.pause(),
  play: () => playerService.play(),
  replaceAudio: (audioUrl, initialPositionMs) =>
    playerService.replaceAudio(audioUrl, initialPositionMs),
})
