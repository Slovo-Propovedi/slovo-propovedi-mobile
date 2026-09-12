import { useCtx } from '@reatom/npm-react'
import { useEffect, useState } from 'react'
import { downloadingAudioUrlAtom } from './download-model'

/**
 * Narrow per-row subscription: only the row whose `audioUrl` matches the global
 * `downloadingAudioUrlAtom` re-renders. Uses the same ctx.subscribe + useState
 * Object.is-bailout pattern as `useIsCached` in shared/lib/audio-cache.
 * @param audioUrl The audio URL to watch; `null`/falsy always resolves to `false`.
 */
export const useIsDownloadingUrl = (audioUrl: null | string): boolean => {
  const ctx = useCtx()
  const [isDownloadingUrl, setIsDownloadingUrl] = useState(false)

  useEffect(() => {
    const readDownloadingUrl = () => {
      const isDownloading = audioUrl ? ctx.get(downloadingAudioUrlAtom) === audioUrl : false
      setIsDownloadingUrl(prev => (prev === isDownloading ? prev : isDownloading))
    }
    readDownloadingUrl()
    if (!audioUrl) return
    return ctx.subscribe(downloadingAudioUrlAtom, readDownloadingUrl)
  }, [audioUrl, ctx])

  return isDownloadingUrl
}
