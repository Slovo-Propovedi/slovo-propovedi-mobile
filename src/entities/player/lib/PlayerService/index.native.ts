import { ctx } from 'shared/lib/reatom-ctx'
import type { LockScreenMetadata } from './types'
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
  public clearLockScreenControls = (): void => {
    lockScreenControls.clear(this.playerInstance)
  }

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
    void setIsBufferingAction(ctx, true)
    void setDurationAction(ctx, 0)
    playerStatusListener.cleanup()

    const player = await audioLoader.replaceAudio(audioUrl, initialPositionMs)
    if (player) this.playerInstance = player
    this.setupListeners()
    return player
  }

  public seekTo = async (newPositionMs: number): Promise<void> => {
    await playbackController.seekTo(this.playerInstance, newPositionMs)
  }

  public setLockScreenMetadata = (metadata: LockScreenMetadata): void => {
    lockScreenControls.setMetadata(this.playerInstance, metadata)
  }

  public setVolume = async (newVolume: number): Promise<void> => {
    await playbackController.setVolume(this.playerInstance, newVolume)
  }

  public stop = async (): Promise<void> => {
    await playbackController.stop(this.playerInstance)
  }

  public unload = async (): Promise<void> => {
    this.clearLockScreenControls()
    playerStatusListener.cleanup()

    if (this.playerInstance) {
      this.playerInstance.remove()
      this.playerInstance = null
    }
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
