import { useCtx } from '@reatom/npm-react'
import { useEffect, useRef, useState } from 'react'
import { cachedUrlsAtom } from '../cache-triggers'
import { audioCacheService } from './AudioCacheService'

export const useIsCached = (audioUrl: null | string, cacheTrigger?: number): boolean => {
  const ctx = useCtx()
  const [fsResult, setFsResult] = useState(false)
  const [overlayHit, setOverlayHit] = useState(false)
  const lastCheckedUrlRef = useRef<null | string>(null)

  useEffect(() => {
    if (!audioUrl) {
      lastCheckedUrlRef.current = null
      return
    }

    let isCancelled = false

    lastCheckedUrlRef.current = audioUrl

    const checkCache = async () => {
      const cached = await audioCacheService.isCached(audioUrl)
      if (!isCancelled) setFsResult(cached)
    }

    void checkCache()

    return () => {
      isCancelled = true
    }
  }, [audioUrl, cacheTrigger])

  // Narrow overlay subscription: manual ctx.subscribe + useState bailout
  // (Object.is) so a registry write re-renders ONLY rows whose url changed.
  const url = audioUrl ?? null
  useEffect(() => {
    const readOverlay = () => {
      const hit = url ? Object.hasOwn(ctx.get(cachedUrlsAtom), url) : false
      setOverlayHit(prev => (prev === hit ? prev : hit))
    }
    readOverlay()
    if (!url) return
    return ctx.subscribe(cachedUrlsAtom, readOverlay)
  }, [ctx, url])

  if (!audioUrl) return false
  // eslint-disable-next-line react-hooks/refs -- intentional: check if ref-tracked URL matches current to gate stale cache state
  if (lastCheckedUrlRef.current !== audioUrl) return false
  return fsResult || overlayHit
}
