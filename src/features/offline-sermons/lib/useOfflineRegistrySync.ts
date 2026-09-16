import { useCtx } from '@reatom/npm-react'
import { useEffect, useRef } from 'react'
import { cachedUrlsAtom, hydrateOfflineRegistry } from 'shared/lib/audio-cache'
import { seedOfflineSermons } from './seedOfflineSermons'
import { syncOfflineSermon } from './syncOfflineSermon'

// App-lifetime sync: hydrates the persistent offline registry once, runs the
// one-time seed backfill, then watches cachedUrlsAtom additions (new download
// completions) and registers each fresh URL in the registry.
export const useOfflineRegistrySync = () => {
  const ctx = useCtx()
  const prevUrlsRef = useRef<ReadonlySet<string>>(new Set())

  useEffect(() => {
    void hydrateOfflineRegistry(ctx)
    void seedOfflineSermons(ctx)

    const readUrls = () => {
      const nextUrls = new Set(Object.keys(ctx.get(cachedUrlsAtom)))
      const prevUrls = prevUrlsRef.current
      for (const url of nextUrls) if (!prevUrls.has(url)) void syncOfflineSermon(ctx, url)

      prevUrlsRef.current = nextUrls
    }
    readUrls()
    return ctx.subscribe(cachedUrlsAtom, readUrls)
  }, [ctx])
}
