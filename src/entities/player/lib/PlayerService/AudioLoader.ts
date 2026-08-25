import { type AudioPlayer, createAudioPlayer } from 'expo-audio'
import { audioCacheService } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { setIsBufferingAction, setPositionAction } from '../../model'
import { startBackgroundCaching } from './BackgroundCachingService'
import { waitForLoaded } from './waitForLoaded'

const REPLACE_AUDIO_ERROR_MESSAGE = 'Ошибка при замене аудио'

class AudioLoader {
  public async loadAudio(audioUrl: string, initialPositionMs = 0): Promise<AudioPlayer | null> {
    if (!audioUrl) return null
    void setIsBufferingAction(ctx, true)
    void setPositionAction(ctx, 0)
    this.trackEndHandled = false
    if (this.playerInstance) {
      // release() (not remove()) — remove() leaks the native player (expo-audio #41852)
      this.playerInstance.release()
      this.playerInstance = null
    }
    const playUrl = await this.getPlaybackUrl(audioUrl)
    // keepAudioSessionActive prevents iOS AVAudioSession deactivation at track end,
    // which otherwise stalls background auto-advance until the app is foregrounded
    const player = createAudioPlayer(
      { uri: playUrl },
      { downloadFirst: false, keepAudioSessionActive: true },
    )
    this.playerInstance = player
    return waitForLoaded(player, initialPositionMs, p => p === this.playerInstance).catch(error => {
      console.error('[AudioLoader] loadAudio: Promise rejected with error:', error)
      reportError(error, 'Ошибка при загрузке аудио')
      void setIsBufferingAction(ctx, false)
      return null
    })
  }

  public async replaceAudio(audioUrl: string, initialPositionMs = 0): Promise<AudioPlayer | null> {
    if (!audioUrl) return null
    void setIsBufferingAction(ctx, true)
    this.trackEndHandled = false
    if (!this.playerInstance) return this.loadAudio(audioUrl, initialPositionMs)
    const playUrl = await this.getPlaybackUrl(audioUrl)
    try {
      // replace-in-place: same native player, same MediaSession, same foreground service.
      // Never pass null to replace() — it crashes the player (expo-audio #48219)
      this.playerInstance.replace(playUrl)
    } catch (error) {
      console.error('[AudioLoader] replaceAudio: replace failed with error:', error)
      reportError(error, REPLACE_AUDIO_ERROR_MESSAGE)
      void setIsBufferingAction(ctx, false)
      return null
    }
    return waitForLoaded(this.playerInstance, initialPositionMs, p => p === this.playerInstance)
  }

  public releaseAndReset(): void {
    if (!this.playerInstance) return
    this.playerInstance.release()
    this.playerInstance = null
  }

  public getPlayerInstance(): AudioPlayer | null {
    return this.playerInstance
  }

  public resetTrackEndHandled(): void {
    this.trackEndHandled = false
  }

  public isTrackEndHandled(): boolean {
    return this.trackEndHandled
  }

  public markTrackEndHandled(): void {
    this.trackEndHandled = true
  }

  private async getPlaybackUrl(audioUrl: string): Promise<string> {
    try {
      const cachedUri = await audioCacheService.getCachedUri(audioUrl)
      if (cachedUri) return cachedUri
    } catch (error) {
      console.error('[AudioLoader] getPlaybackUrl: Error checking cache:', error)
      reportError(error, 'Ошибка при проверке кэша аудио')
    }
    startBackgroundCaching(audioUrl)
    return audioUrl
  }

  private playerInstance: AudioPlayer | null = null
  private trackEndHandled = false
}

export const audioLoader = new AudioLoader()
