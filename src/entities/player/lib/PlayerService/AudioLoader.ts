import AsyncStorage from '@react-native-async-storage/async-storage'
import { type AudioPlayer, createAudioPlayer } from 'expo-audio'
import { CURRENT_SOUND_DURATION } from 'shared/config'
import { audioCacheService } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { setDurationAction, setIsBufferingAction, setPositionAction } from '../../model'
import {
  setDownloadingUrlAction,
  setDownloadProgressAction,
  setIsDownloadingAction,
} from '../download-model'

const LOAD_TIMEOUT_MS = 30000
const LOAD_CHECK_INTERVAL_MS = 100

class AudioLoader {
  public async loadAudio(audioUrl: string, initialPositionMs = 0): Promise<AudioPlayer | null> {
    if (!audioUrl) return null
    void setIsBufferingAction(ctx, true)
    void setPositionAction(ctx, 0)
    this.trackEndHandled = false
    if (this.playerInstance) {
      this.playerInstance.pause()
      this.playerInstance = null
    }
    const playUrl = await this.getPlaybackUrl(audioUrl)
    const player = createAudioPlayer({ uri: playUrl }, { downloadFirst: true })
    this.playerInstance = player

    return new Promise<AudioPlayer | null>(resolve => {
      let elapsed = 0
      const checkLoaded = setInterval(() => {
        elapsed += LOAD_CHECK_INTERVAL_MS
        if (player.isLoaded) {
          clearInterval(checkLoaded)
          const dur = Math.floor(player.duration * 1000)
          void setDurationAction(ctx, dur)
          void AsyncStorage.setItem(CURRENT_SOUND_DURATION, String(dur))
          void setIsBufferingAction(ctx, false)
          void player.seekTo(initialPositionMs / 1000)
          void setPositionAction(ctx, initialPositionMs)
          try {
            resolve(player)
          } catch (error) {
            console.error('[AudioLoader] loadAudio: ERROR - resolve() threw exception:', error)
            throw error
          }
        } else if (elapsed >= LOAD_TIMEOUT_MS) {
          clearInterval(checkLoaded)
          void setIsBufferingAction(ctx, false)
          try {
            resolve(null)
          } catch (error) {
            console.error('[AudioLoader] loadAudio: ERROR - resolve(null) threw exception:', error)
            throw error
          }
        }
      }, LOAD_CHECK_INTERVAL_MS)
    }).catch(error => {
      console.error('[AudioLoader] loadAudio: Promise rejected with error:', error)
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
    this.playerInstance.replace(playUrl)
    return this.playerInstance
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
    }
    this.startBackgroundCaching(audioUrl)
    return audioUrl
  }

  private startBackgroundCaching = (audioUrl: string) => {
    void setIsDownloadingAction(ctx, true)
    void setDownloadingUrlAction(ctx, audioUrl)
    void setDownloadProgressAction(ctx, 0)
    audioCacheService
      .cacheAudio(audioUrl, progress => {
        void setDownloadProgressAction(ctx, progress)
      })
      .then(() => {
        void setDownloadProgressAction(ctx, 1)
      })
      .catch(error => {
        console.error('[AudioLoader] Background caching failed:', error)
      })
      .finally(() => {
        void setIsDownloadingAction(ctx, false)
        void setDownloadingUrlAction(ctx, null)
      })
  }

  private playerInstance: AudioPlayer | null = null
  private trackEndHandled = false
}

export const audioLoader = new AudioLoader()
