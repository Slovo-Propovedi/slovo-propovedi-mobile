import { useEffect, useState } from 'react'
import { audioCacheService } from './AudioCacheService'

export const useIsCached = (audioUrl: null | string, cacheTrigger?: number): boolean => {
  const [isCached, setIsCached] = useState(false)

  useEffect(() => {
    if (!audioUrl) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- correct
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
  }, [audioUrl, cacheTrigger])

  return isCached
}
