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
import { audioLoader } from './native/AudioLoader'
import { audioModeManager } from './native/AudioModeManager'
import { lockScreenControls } from './native/LockScreenControls'
import { createAudioInterruptionHandler, setupPlayerListeners } from './native/nativePlayerHelpers'
import { playbackController } from './native/PlaybackController'
import { playerStatusListener } from './native/PlayerStatusListener'
import { recoverStreamAfterReconnect as healStreamAfterReconnect } from './native/reconnectHeal'
import { resumeWithSourceSwap } from './native/resumeWithSourceSwap'
import { wireTrackAutoAdvance } from './native/wireTrackAutoAdvance'

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
    playbackController.applyPreferences(player)
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

  public resumeAfterPause = async (audioUrl: string): Promise<void> =>
    resumeWithSourceSwap(this.sourceSwap, audioUrl)

  public recoverStreamAfterReconnect = (audioUrl: string): Promise<void> =>
    healStreamAfterReconnect(this, audioUrl)

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
    await audioModeManager.configure()

    const player = await audioLoader.replaceAudio(audioUrl, initialPositionMs)
    if (player) this.playerInstance = player
    playbackController.applyPreferences(this.playerInstance)
    this.setupListeners()
    return player
  }

  public seekTo = async (newPositionMs: number): Promise<void> => {
    await playbackController.seekTo(this.playerInstance, newPositionMs, this.sourceSwap)
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
    playerStatusListener.cleanup() // Detach first: the post-stop status tick must not flush position 0.
    await playbackController.stop(this.playerInstance)
  }

  public unload = async (): Promise<void> => {
    // No lockScreenControls.clear(): release() removes the notification natively (issue #50).
    playerStatusListener.cleanup()
    audioLoader.releaseAndReset()
    this.playerInstance = null
  }

  private setupListeners = (): void => {
    if (!this.playerInstance) return
    setupPlayerListeners(this.playerInstance, this.handleAudioInterruption)
  }

  private handleAudioInterruption = createAudioInterruptionHandler({
    pause: this.pause,
    play: this.play,
  })

  private playerInstance: AudioPlayer | null = null
  private sourceSwap = { play: this.play, replaceAudio: this.replaceAudio }
}

export const playerService = new PlayerService()
wireTrackAutoAdvance(playerService)
