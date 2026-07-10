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
  if (lastCheckedUrlRef.current !== audioUrl) return false
  return isCached
}
