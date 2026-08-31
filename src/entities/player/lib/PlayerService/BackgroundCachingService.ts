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

const inflightDownloads = new Set<string>()

export const _resetInFlightDownloadsForTesting = (): void => {
  inflightDownloads.clear()
}

export const startBackgroundCaching = (audioUrl: string): void => {
  if (!audioUrl) return

  if (inflightDownloads.has(audioUrl)) {
    void setIsDownloadingAction(ctx, true)
    void setDownloadingUrlAction(ctx, audioUrl)
    const perTrackProgress = ctx.get(playlistDownloadProgressAtom)[audioUrl] ?? 0
    void setDownloadProgressAction(ctx, perTrackProgress)
    return
  }

  inflightDownloads.add(audioUrl)

  void setIsDownloadingAction(ctx, true)
  void setDownloadingUrlAction(ctx, audioUrl)
  void setDownloadProgressAction(ctx, 0)
  playlistDownloadProgressAtom(ctx, prev => ({ ...prev, [audioUrl]: 0 }))

  audioCacheService
    .cacheAudio(audioUrl, progress => {
      if (ctx.get(downloadingAudioUrlAtom) === audioUrl)
        void setDownloadProgressAction(ctx, progress)
      playlistDownloadProgressAtom(ctx, prev => ({ ...prev, [audioUrl]: progress }))
    })
    .then(() => {
      removeTrackProgress(audioUrl)
      void incrementCacheTrigger(ctx)
      if (ctx.get(downloadingAudioUrlAtom) === audioUrl) void setDownloadProgressAction(ctx, 1)
    })
    .catch(error => {
      // Silent failure: background caching is an automatic, invisible optimization
      // (Issue #73) — playback streams from network and is unaffected; a network
      // error must not open the global error dialog. Next playback of this track
      // re-triggers caching.
      console.error('[BackgroundCaching] Caching failed:', error)
      removeTrackProgress(audioUrl)
    })
    .finally(() => {
      inflightDownloads.delete(audioUrl)
      if (ctx.get(downloadingAudioUrlAtom) === audioUrl) {
        void setIsDownloadingAction(ctx, false)
        void setDownloadingUrlAction(ctx, null)
      }
    })
}
