import AsyncStorage from '@react-native-async-storage/async-storage'
import { type AudioPlayer, createAudioPlayer } from 'expo-audio'
import { CURRENT_SOUND_DURATION } from 'shared/config'
import { audioCacheService } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { setDurationAction, setIsBufferingAction, setPositionAction } from '../../model'
import { startBackgroundCaching } from './BackgroundCachingService'

const LOAD_TIMEOUT_MS = 30000
const LOAD_CHECK_INTERVAL_MS = 100
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

    return this.waitForLoaded(player, initialPositionMs).catch(error => {
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
    return this.waitForLoaded(this.playerInstance, initialPositionMs)
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

  private waitForLoaded(player: AudioPlayer, initialPositionMs = 0): Promise<AudioPlayer | null> {
    return new Promise(resolve => {
      let elapsed = 0
      const checkLoaded = setInterval(() => {
        elapsed += LOAD_CHECK_INTERVAL_MS
        if (player.isLoaded) {
          clearInterval(checkLoaded)
          const dur = Math.floor(player.duration * 1000)
          void setDurationAction(ctx, dur)
          void AsyncStorage.setItem(CURRENT_SOUND_DURATION, String(dur))
          void setIsBufferingAction(ctx, false)
          // Guarded: a rejection here (first-tick race mid-transition) must not
          // surface as an unhandled promise rejection
          player.seekTo(initialPositionMs / 1000).catch(error => {
            console.error('[AudioLoader] waitForLoaded: initial seekTo failed:', error)
          })
          void setPositionAction(ctx, initialPositionMs)
          resolve(player)
        } else if (elapsed >= LOAD_TIMEOUT_MS) {
          clearInterval(checkLoaded)
          void setIsBufferingAction(ctx, false)
          resolve(null)
        }
      }, LOAD_CHECK_INTERVAL_MS)
    })
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
