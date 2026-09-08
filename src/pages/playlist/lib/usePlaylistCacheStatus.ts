import { useEffect, useMemo, useRef, useState } from 'react'
import { audioCacheService } from 'shared/lib/audio-cache'
import type { TrackToCache } from './PlaylistCacheService'

const STATUS_REFRESH_DEBOUNCE_MS = 250

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
  const checkedTracksRef = useRef<null | TrackToCache[]>(null)

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
    let timer: null | ReturnType<typeof setTimeout> = null

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

    // The first check for a given track set runs immediately (the playlist menu
    // depends on it); later trigger-driven re-checks are debounced so a burst of
    // cache triggers collapses into one status refresh.
    const isFirstForTracks = checkedTracksRef.current !== tracksWithUrls
    checkedTracksRef.current = tracksWithUrls

    if (isFirstForTracks) void checkCacheStatus()
    else timer = setTimeout(() => void checkCacheStatus(), STATUS_REFRESH_DEBOUNCE_MS)

    return () => {
      isCancelled = true
      if (timer !== null) clearTimeout(timer)
    }
  }, [tracksWithUrls, cacheTrigger])

  if (tracksWithUrls.length === 0) return { allCached: false, cachedCount: 0, totalCount: 0 }

  return status
}
