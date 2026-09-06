/**
 * Cache summary for the web audio bucket. Kept separate from `webCacheApi` so
 * the enumeration below stays isolated from the service paths that must never
 * call `cache.keys()`.
 */

import { openAudioCache } from './openAudioCache'
import { isCacheStorageAvailable } from './webCacheApi'
import { isManifestUrl } from './webCacheManifest'

export interface AudioCacheSummary {
  fileCount: number
  totalSize: number
}

/**
 * Перечисляет бакет (`cache.keys()`). НЕ вызывать из стартовых/сервисных путей
 * (cleanup/isCached/remove): энумерация возможно-повреждённого iOS-бакета — риск
 * crash-loop (WebKit 260962/277598). Только по явному действию пользователя
 * (напр., экран настроек).
 */
export const summarizeAudioCache = async (): Promise<AudioCacheSummary> => {
  if (!isCacheStorageAvailable()) return { fileCount: 0, totalSize: 0 }
  const cache = await openAudioCache()
  const requests = await cache.keys()

  let totalSize = 0
  let fileCount = 0
  for (const request of requests) {
    if (isManifestUrl(request.url)) continue
    fileCount++
    const response = await cache.match(request)
    // Opaque (cross-origin, no CORS) responses report no length — skip them.
    const declared = Number(response?.headers.get('Content-Length'))
    if (Number.isFinite(declared) && declared > 0) totalSize += declared
  }

  return { fileCount, totalSize }
}
