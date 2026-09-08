import { useCtx } from '@reatom/npm-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { audioCacheService } from 'shared/lib/audio-cache'
import { cachedUrlsAtom } from 'shared/lib/cache-triggers'
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
  const ctx = useCtx()
  const [fsResults, setFsResults] = useState<Record<string, boolean>>({})
  const [overlay, setOverlay] = useState<Record<string, boolean>>({})
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
        tracksWithUrls.map(async track => ({
          cached: await audioCacheService.isCached(track.audioUrl),
          url: track.audioUrl,
        })),
      )
      if (isCancelled) return

      setFsResults(prev => {
        const next = { ...prev }
        for (const { cached, url } of results) next[url] = cached
        return next
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

  // Narrow overlay subscription: a registry write updates counts reactively
  // WITHOUT a cacheUpdateTriggerAtom increment (no debounced FS rescan needed).
  useEffect(() => {
    const readOverlay = () => {
      const urls = ctx.get(cachedUrlsAtom)
      setOverlay(prev => {
        const changed = tracksWithUrls.some(
          track => Boolean(urls[track.audioUrl]) !== Boolean(prev[track.audioUrl]),
        )
        if (!changed) return prev
        const next: Record<string, boolean> = {}
        for (const track of tracksWithUrls) if (urls[track.audioUrl]) next[track.audioUrl] = true

        return next
      })
    }
    readOverlay()
    return ctx.subscribe(cachedUrlsAtom, readOverlay)
  }, [ctx, tracksWithUrls])

  const { allCached, cachedCount } = useMemo(() => {
    let count = 0
    for (const track of tracksWithUrls)
      if (fsResults[track.audioUrl] || overlay[track.audioUrl]) count++
    return { allCached: count === tracksWithUrls.length, cachedCount: count }
  }, [fsResults, overlay, tracksWithUrls])

  if (tracksWithUrls.length === 0) return { allCached: false, cachedCount: 0, totalCount: 0 }

  return { allCached, cachedCount, totalCount: tracksWithUrls.length }
}
