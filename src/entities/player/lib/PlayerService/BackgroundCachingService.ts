import { audioCacheService } from 'shared/lib/audio-cache'
import { incrementCacheTrigger, playlistDownloadProgressAtom } from 'shared/lib/cache-triggers'
import { ctx } from 'shared/lib/reatom-ctx'
import {
  downloadingAudioUrlAtom,
  setDownloadingUrlAction,
  setDownloadProgressAction,
  setIsDownloadingAction,
} from '../download-model'

const removeTrackProgress = (audioUrl: string) => {
  playlistDownloadProgressAtom(ctx, prev => {
    const next = { ...prev }
    delete next[audioUrl]
    return next
  })
}

export const startBackgroundCaching = (audioUrl: string): void => {
  if (!audioUrl) return
  void setIsDownloadingAction(ctx, true)
  void setDownloadingUrlAction(ctx, audioUrl)
  void setDownloadProgressAction(ctx, 0)
  playlistDownloadProgressAtom(ctx, prev => ({ ...prev, [audioUrl]: 0 }))

  audioCacheService
    .cacheAudio(audioUrl, progress => {
      void setDownloadProgressAction(ctx, progress)
      playlistDownloadProgressAtom(ctx, prev => ({ ...prev, [audioUrl]: progress }))
    })
    .then(() => {
      removeTrackProgress(audioUrl)
      void incrementCacheTrigger(ctx)
      if (ctx.get(downloadingAudioUrlAtom) === audioUrl) void setDownloadProgressAction(ctx, 1)
    })
    .catch(error => {
      console.error('[BackgroundCaching] Caching failed:', error)
      removeTrackProgress(audioUrl)
    })
    .finally(() => {
      if (ctx.get(downloadingAudioUrlAtom) === audioUrl) {
        void setIsDownloadingAction(ctx, false)
        void setDownloadingUrlAction(ctx, null)
        void setDownloadProgressAction(ctx, 0)
      }
    })
}
