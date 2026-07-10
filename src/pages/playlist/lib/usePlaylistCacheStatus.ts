import { useEffect, useMemo, useState } from 'react'
import { audioCacheService } from 'shared/lib/audio-cache'
import type { TrackToCache } from './PlaylistCacheService'

export interface PlaylistCacheStatus {
  allCached: boolean
  cachedCount: number
  totalCount: number
}

export const usePlaylistCacheStatus = (
  tracks: TrackToCache[],
  cacheTrigger?: number,
): PlaylistCacheStatus => {
  const [status, setStatus] = useState<PlaylistCacheStatus>({
    allCached: false,
    cachedCount: 0,
    totalCount: 0,
  })

  // Parse: keep only tracks with audio URLs
  const tracksWithUrls = useMemo(
    () =>
      tracks.filter(
        (track): track is { audioUrl: string } & TrackToCache => track.audioUrl != null,
      ),
    [tracks],
  )

  useEffect(() => {
    if (tracksWithUrls.length === 0) return

    let isCancelled = false

    const checkCacheStatus = async () => {
      const results = await Promise.all(
        tracksWithUrls.map(track => audioCacheService.isCached(track.audioUrl)),
      )
      if (isCancelled) return

      const cachedCount = results.filter(Boolean).length
      setStatus({
        allCached: cachedCount === tracksWithUrls.length,
        cachedCount,
        totalCount: tracksWithUrls.length,
      })
    }

    void checkCacheStatus()

    return () => {
      isCancelled = true
    }
  }, [tracksWithUrls, cacheTrigger])

  if (tracksWithUrls.length === 0) return { allCached: false, cachedCount: 0, totalCount: 0 }

  return status
}
