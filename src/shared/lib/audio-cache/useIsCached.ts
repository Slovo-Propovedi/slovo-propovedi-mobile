import { useEffect, useState } from 'react'
import { audioCacheService } from './AudioCacheService'

export const useIsCached = (audioUrl: null | string): boolean => {
  const [isCached, setIsCached] = useState(false)

  useEffect(() => {
    if (!audioUrl) {
      setIsCached(false)
      return
    }

    let isCancelled = false

    const checkCache = async () => {
      const cached = await audioCacheService.isCached(audioUrl)
      if (!isCancelled) setIsCached(cached)
    }

    void checkCache()

    return () => {
      isCancelled = true
    }
  }, [audioUrl])

  return isCached
}
