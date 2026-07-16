import { useEffect, useRef, useState } from 'react'
import { audioCacheService } from './AudioCacheService'

export const useIsCached = (audioUrl: null | string, cacheTrigger?: number): boolean => {
  const [isCached, setIsCached] = useState(false)
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
      if (!isCancelled) setIsCached(cached)
    }

    void checkCache()

    return () => {
      isCancelled = true
    }
  }, [audioUrl, cacheTrigger])

  if (!audioUrl) return false
  // eslint-disable-next-line react-hooks/refs -- intentional: check if ref-tracked URL matches current to gate stale cache state
  if (lastCheckedUrlRef.current !== audioUrl) return false
  return isCached
}
