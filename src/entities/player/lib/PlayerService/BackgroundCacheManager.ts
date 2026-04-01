import { audioCacheService } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import {
  setDownloadingUrlAction,
  setDownloadProgressAction,
  setIsDownloadingAction,
} from '../download-model'

class BackgroundCacheManager {
  public async startCaching(audioUrl: string): Promise<void> {
    if (!audioUrl) throw new Error('audioUrl is required for caching')

    setIsDownloadingAction(ctx, true)
    setDownloadingUrlAction(ctx, audioUrl)
    setDownloadProgressAction(ctx, 0)

    try {
      await audioCacheService.cacheAudio(audioUrl, progress => {
        setDownloadProgressAction(ctx, progress)
      })
      setDownloadProgressAction(ctx, 1)
    } catch (error) {
      console.error('[BackgroundCacheManager] Caching failed:', error)
    } finally {
      setIsDownloadingAction(ctx, false)
      setDownloadingUrlAction(ctx, null)
    }
  }
}

export const backgroundCacheManager = new BackgroundCacheManager()
