/**
 * Commit-manifest protocol for the web audio cache.
 *
 * A `cache.put` killed mid-write (or an opaque no-CORS response) leaves bytes
 * JS cannot read back, so a URL counts as cached only once it is listed in a
 * small same-origin JSON manifest inside the bucket. Legacy entries start as
 * `unverified` and are committed only after `webCacheManifestMigration.ts`
 * proves their body length; the service worker reads only committed `urls`.
 * The manifest key is origin-rooted: a relative key resolves against
 * `document.baseURI` (the current route) on the page but against the script
 * root in the SW. Low-level state, serialization and the cross-tab lock live in
 * `webCacheManifestStore.ts`.
 */

import { AUDIO_MANIFEST_KEY, type ManifestState, readManifestEntry } from './webCacheManifestRead'
import { enqueueManifestWrite, writeManifestNow } from './webCacheManifestStore'

const canonicalUrl = (audioUrl: string): string => new URL(audioUrl).href

/**
 * Whether an absolute cache key (as returned by `cache.keys()`) is the manifest
 * entry. Path-suffix matching also covers legacy per-route keys (`/listen/...`).
 * @param url - Absolute cache key URL.
 */
export const isManifestUrl = (url: string): boolean => {
  try {
    return new URL(url).pathname.endsWith('/' + AUDIO_MANIFEST_KEY)
  } catch {
    return url === AUDIO_MANIFEST_KEY
  }
}

/**
 * Read the committed URL set; null means the entry is missing (distinct from
 * empty). A corrupt manifest counts as an empty set (logged), so callers retry.
 * @param cache - The audio cache bucket.
 */
export const readCommittedUrls = async (cache: Cache): Promise<null | Set<string>> => {
  const state = await readManifestEntry(cache)
  return state ? state.urls : null
}

let ensureInflight: null | Promise<ManifestState> = null

/**
 * Return the manifest state, building it from the bucket's entries on first use
 * (legacy migration). Every non-manifest entry starts unverified — nothing is
 * trusted into `urls` without a verified body. Commit-path only, one in flight.
 * @param cache - The audio cache bucket.
 */
const ensureManifest = (cache: Cache): Promise<ManifestState> => {
  if (ensureInflight) return ensureInflight
  ensureInflight = buildManifest(cache).finally(() => {
    ensureInflight = null
  })
  return ensureInflight
}

const buildManifest = async (cache: Cache): Promise<ManifestState> => {
  const existing = await readManifestEntry(cache)
  if (existing) return existing
  const requests = await cache.keys()
  const unverified = requests.map(request => request.url).filter(url => !isManifestUrl(url))
  await writeManifestNow(cache, new Set(), unverified)
  return { unverified, urls: new Set() }
}

/**
 * Serialized read-modify-write that adds a canonical URL to the manifest once
 * its bytes are fully `put` into the bucket, and drops it from `unverified`
 * (a fresh download is complete by construction).
 * @param cache - The audio cache bucket.
 * @param audioUrl - Canonical URL of the track.
 */
export const commitAudioUrl = async (cache: Cache, audioUrl: string): Promise<void> => {
  const canonical = canonicalUrl(audioUrl)
  await enqueueManifestWrite(async () => {
    const state = await ensureManifest(cache)
    const urls = new Set(state.urls)
    urls.add(canonical)
    await writeManifestNow(
      cache,
      urls,
      state.unverified.filter(url => url !== canonical),
    )
  })
}

/**
 * Serialized read-modify-write that removes a canonical URL from both lists
 * after its entry is deleted, so a re-download is not skipped and migration
 * never verifies a missing URL.
 * @param cache - The audio cache bucket.
 * @param audioUrl - Canonical URL of the track.
 */
export const uncommitAudioUrl = async (cache: Cache, audioUrl: string): Promise<void> => {
  const canonical = canonicalUrl(audioUrl)
  await enqueueManifestWrite(async () => {
    const state = await readManifestEntry(cache)
    if (!state) return
    state.urls.delete(canonical)
    await writeManifestNow(
      cache,
      state.urls,
      state.unverified.filter(url => url !== canonical),
    )
  })
}

export const isUrlCommitted = (urls: Set<string>, audioUrl: string): boolean =>
  urls.has(canonicalUrl(audioUrl))
