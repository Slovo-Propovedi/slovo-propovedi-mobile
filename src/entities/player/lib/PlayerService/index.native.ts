import { type AudioPlayer } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import type { LockScreenMetadata } from './types'
import {
  setDurationAction,
  setIsBufferingAction,
  setIsPlayingAction,
  setPositionAction,
} from '../../model'
import {
  audioLoader,
  audioModeManager,
  lockScreenControls,
  playbackController,
  playerStatusListener,
  trackAutoAdvanceService,
} from './sub-services'
export class PlayerService {
  public setLockScreenMetadata = (metadata: LockScreenMetadata): void => {
    lockScreenControls.setMetadata(this.playerInstance, metadata)
  }

  public clearLockScreenControls = (): void => {
    lockScreenControls.clear(this.playerInstance)
  }

  public play = async (): Promise<void> => {
    await playbackController.play(this.playerInstance)
  }

  public pause = async (): Promise<void> => {
    await playbackController.pause(this.playerInstance)
  }

  public stop = async (): Promise<void> => {
    await playbackController.stop(this.playerInstance)
  }

  public seekTo = async (newPositionMs: number): Promise<void> => {
    await playbackController.seekTo(this.playerInstance, newPositionMs)
  }

  public getStatus = () => playbackController.getStatus(this.playerInstance)

  public setVolume = async (newVolume: number): Promise<void> => {
    await playbackController.setVolume(this.playerInstance, newVolume)
  }

  public getVolume = (): number => playbackController.getVolume()

  public loadAudio = async (
    audioUrl: string,
    initialPositionMs = 0,
  ): Promise<AudioPlayer | null> => {
    if (!audioUrl) return null
    void setIsBufferingAction(ctx, true)
    void setPositionAction(ctx, 0)
    await this.ensureAudioModeConfigured()

    const player = await audioLoader.loadAudio(audioUrl, initialPositionMs)
    if (!player) {
      void setIsBufferingAction(ctx, false)
      return null
    }

    this.playerInstance = player
    this.setupListeners()

    return player
  }

  public replaceAudio = async (
    audioUrl: string,
    initialPositionMs = 0,
  ): Promise<AudioPlayer | null> => {
    if (!audioUrl) return null

    void setIsBufferingAction(ctx, true)
    void setDurationAction(ctx, 0)
    audioLoader.resetTrackEndHandled()
    playerStatusListener.resetTrackEndHandled()

    const player = await audioLoader.replaceAudio(audioUrl, initialPositionMs)
    if (!player) return null

    this.playerInstance = player
    this.setupListeners()
    return player
  }

  public unload = async (): Promise<void> => {
    this.clearLockScreenControls()
    playerStatusListener.cleanup()

    if (this.playerInstance) {
      this.playerInstance.pause()
      this.playerInstance = null
    }
  }

  private setupListeners = (): void => {
    if (!this.playerInstance) return

    playerStatusListener.setupListeners(this.playerInstance, {
      onBufferingChange: isBuffering => void setIsBufferingAction(ctx, isBuffering),
      onDurationChange: durationMs => void setDurationAction(ctx, durationMs),
      onPlayingChange: isPlaying => void setIsPlayingAction(ctx, isPlaying),
      onPositionChange: positionMs => void setPositionAction(ctx, positionMs),
      onTrackEnd: () => {
        void trackAutoAdvanceService.handleTrackEnd()
      },
    })
  }

  private async ensureAudioModeConfigured(): Promise<void> {
    await audioModeManager.configure()
  }

  private playerInstance: AudioPlayer | null = null
}

export const playerService = new PlayerService()

trackAutoAdvanceService.setPlayerActions({
  pause: () => playerService.pause(),
  play: () => playerService.play(),
  replaceAudio: (audioUrl, initialPositionMs) =>
    playerService.replaceAudio(audioUrl, initialPositionMs),
})
