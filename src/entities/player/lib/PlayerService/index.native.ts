import { type AudioPlaylist } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import { type RepeatMode, setIsBufferingAction, setPositionAction } from '../../model'
import { setPauseTypeAction } from '../../pauseType'
import { type PlaybackRate } from '../../playback-rate'
import { setIsStalledOfflineAction } from '../stalledOffline'
import { audioEffectsAttach } from './native/audioEffectsAttach'
import { audioModeManager } from './native/AudioModeManager'
import { lockScreenControls } from './native/LockScreenControls'
import { mapRepeatMode } from './native/mapRepeatMode'
import { playbackController } from './native/PlaybackController'
import { createPlayerServiceCallbacks } from './native/playerServiceCallbacks'
import { playlistEngine } from './native/PlaylistEngine'
import { wirePlaylistStatus } from './native/playlistStatusHandler'
import { loadQueue, replaceQueueTrack } from './native/queueLoader'
import { createQueueSourceSwap } from './native/queueSourceSwap'
import { reconcileOnForeground } from './native/reconcileOnForeground'
import { recoverStreamAfterReconnect as healStreamAfterReconnect } from './native/reconnectHeal'
import { resumeWithSourceSwap } from './native/resumeWithSourceSwap'
import { type LockScreenMetadata } from './types'

export class PlayerService {
  public getStatus = () => playbackController.getStatus(playlistEngine.getPlaylist())

  public getVolume = () => playbackController.getVolume()

  public loadAudio = async (
    audioUrl: string,
    initialPositionMs = 0,
  ): Promise<AudioPlaylist | null> => {
    if (!audioUrl) return null
    void setIsBufferingAction(ctx, true)
    void setPositionAction(ctx, 0)
    void setIsStalledOfflineAction(ctx, false)
    await audioModeManager.configure()
    this.rewireStatusHandler()

    const playlist = await loadQueue(audioUrl, initialPositionMs)
    if (!playlist) {
      void setIsBufferingAction(ctx, false)
      return null
    }
    if (initialPositionMs > 0) void setPositionAction(ctx, initialPositionMs)
    return playlist
  }

  public replaceAudio = async (
    audioUrl: string,
    initialPositionMs = 0,
    options?: { preserveSeekGuard?: boolean },
  ): Promise<AudioPlaylist | null> => {
    if (!audioUrl) return null
    if (!options?.preserveSeekGuard) playbackController.resetSeekGuard()
    void setIsStalledOfflineAction(ctx, false)
    await audioModeManager.configure()
    this.rewireStatusHandler()

    return replaceQueueTrack(audioUrl, initialPositionMs)
  }

  public pause = async (pauseType?: 'auto'): Promise<void> => {
    if (pauseType === 'auto') void setPauseTypeAction(ctx, 'auto')
    await playbackController.pause(playlistEngine.getPlaylist())
  }

  public play = (): Promise<void> => playbackController.play(playlistEngine.getPlaylist())

  public resumeAfterPause = async (audioUrl: string): Promise<void> =>
    resumeWithSourceSwap(this.sourceSwap, audioUrl)

  public recoverStreamAfterReconnect = (audioUrl: string): Promise<void> =>
    healStreamAfterReconnect(this, audioUrl)

  public reconcileOnForeground = (): Promise<void> => reconcileOnForeground()

  public seekTo = async (newPositionMs: number): Promise<void> => {
    await playbackController.seekTo(playlistEngine.getPlaylist(), newPositionMs, this.sourceSwap)
  }

  public setLockScreenMetadata = (metadata: LockScreenMetadata): void => {
    lockScreenControls.setMetadata(playlistEngine.getPlaylist(), metadata)
  }

  public reassertLockScreenMetadata = (metadata: LockScreenMetadata): void => {
    lockScreenControls.reassertMetadata(playlistEngine.getPlaylist(), metadata)
  }

  public setPlaybackRate = async (rate: PlaybackRate): Promise<void> => {
    await playbackController.setPlaybackRate(playlistEngine.getPlaylist(), rate)
  }

  public setVolume = async (newVolume: number): Promise<void> => {
    await playbackController.setVolume(playlistEngine.getPlaylist(), newVolume)
  }

  public applyVolume = (newVolume: number): void => {
    playbackController.applyVolume(playlistEngine.getPlaylist(), newVolume)
  }

  public setRepeatMode = (mode: RepeatMode): void => {
    playlistEngine.setLoopMode(mapRepeatMode(mode))
  }

  public stop = async (): Promise<void> => {
    // Suppress the post-stop playing→false edge: it must not re-arm auto-pause.
    this.statusMuted = true
    await playbackController.stop(playlistEngine.getPlaylist())
  }

  public unload = async (): Promise<void> => {
    // No lockScreenControls.clear(): teardown removes the notification natively (issue #50).
    this.statusMuted = true
    audioEffectsAttach.detach()
    playlistEngine.destroy()
  }

  private rewireStatusHandler = (): void => {
    wirePlaylistStatus(this.callbacks, () => this.statusMuted)
    this.statusMuted = false
  }

  private callbacks = createPlayerServiceCallbacks(this)

  private statusMuted = false

  private sourceSwap = createQueueSourceSwap(this.play)
}

export const playerService = new PlayerService()
