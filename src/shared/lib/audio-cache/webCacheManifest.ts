/**
 * Commit-manifest protocol for the web audio cache.
 *
 * `cache.put` of an opaque (no-CORS) response writes bytes JS cannot read back,
 * so a process kill mid-put leaves a truncated entry that `cache.match` would
 * otherwise report as a fully cached track. To keep the invariant
 * "cached ⇔ fully downloaded", a URL counts as cached only once it is listed in
 * a small same-origin JSON manifest inside the bucket. The service worker gates
 * offline serving on the same manifest, and the manifest entry itself is
 * excluded from cache summaries.
 */

export const AUDIO_MANIFEST_KEY = '__manifest__'

interface Manifest {
  urls: string[]
  version: number
}

const canonicalUrl = (audioUrl: string): string => new URL(audioUrl).href

/**
 * Whether a cache key (as returned by `cache.keys()`, i.e. An absolute URL)
 * refers to the manifest entry. The manifest is stored via `cache.put` with the
 * reserved same-origin key, which the browser resolves to an absolute URL.
 * @param url - Absolute cache key URL.
 */
export const isManifestUrl = (url: string): boolean => {
  try {
    return new URL(url).pathname.endsWith('/' + AUDIO_MANIFEST_KEY)
  } catch {
    return url === AUDIO_MANIFEST_KEY
  }
}

const writeManifest = async (cache: Cache, urls: Set<string>): Promise<void> => {
  const manifest: Manifest = { urls: [...urls], version: 1 }
  await cache.put(AUDIO_MANIFEST_KEY, new Response(JSON.stringify(manifest)))
}

/**
 * Read the committed URL set from the manifest. Returns null when the manifest
 * entry is missing (distinct from empty). A corrupt/unparseable manifest is
 * treated as an empty set (logged) so callers fall back to re-downloading.
 * @param cache - The audio cache bucket.
 */
export const readCommittedUrls = async (cache: Cache): Promise<null | Set<string>> => {
  const entry = await cache.match(AUDIO_MANIFEST_KEY, { ignoreVary: true })
  if (!entry) return null
  try {
    const manifest = await entry.json()
    const urls = Array.isArray(manifest.urls) ? manifest.urls : []
    return new Set(urls)
  } catch (error) {
    console.error('[audio-cache] Invalid manifest, treating as empty:', error)
    return new Set()
  }
}

let ensureInflight: null | Promise<Set<string>> = null

/**
 * Return the committed URL set, building the manifest once from the bucket's
 * existing entries on first use (legacy migration). Commit-path only — never
 * called from read/delete/cleanup paths. Concurrent calls share a single build
 * via a module-level in-flight promise; `cache.keys()` failures propagate.
 * @param cache - The audio cache bucket.
 */
const ensureManifest = (cache: Cache): Promise<Set<string>> => {
  if (ensureInflight) return ensureInflight
  ensureInflight = buildManifest(cache).finally(() => {
    ensureInflight = null
  })
  return ensureInflight
}

const buildManifest = async (cache: Cache): Promise<Set<string>> => {
  const existing = await readCommittedUrls(cache)
  if (existing) return existing
  const requests = await cache.keys()
  const urls = new Set(requests.map(request => request.url).filter(url => !isManifestUrl(url)))
  await writeManifest(cache, urls)
  return urls
}

let manifestQueue: Promise<void> = Promise.resolve()

const enqueueManifestWrite = (write: () => Promise<void>): Promise<void> => {
  const run = manifestQueue.then(write, write)
  // Keep the chain alive even when a write rejects, so later commits still run.
  manifestQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

/**
 * Serialized read-modify-write that adds a canonical URL to the manifest.
 * Committing happens only after a full download has been `put` into the bucket.
 * @param cache - The audio cache bucket.
 * @param audioUrl - Canonical URL of the track.
 */
export const commitAudioUrl = async (cache: Cache, audioUrl: string): Promise<void> => {
  const canonical = canonicalUrl(audioUrl)
  await enqueueManifestWrite(async () => {
    const urls = await ensureManifest(cache)
    urls.add(canonical)
    await writeManifest(cache, urls)
  })
}

/**
 * Serialized read-modify-write that removes a canonical URL from the manifest,
 * used when an entry is deleted so a re-download is not skipped.
 * @param cache - The audio cache bucket.
 * @param audioUrl - Canonical URL of the track.
 */
export const uncommitAudioUrl = async (cache: Cache, audioUrl: string): Promise<void> => {
  const canonical = canonicalUrl(audioUrl)
  await enqueueManifestWrite(async () => {
    const urls = await readCommittedUrls(cache)
    if (!urls) return
    urls.delete(canonical)
    await writeManifest(cache, urls)
  })
}

export const isUrlCommitted = (urls: Set<string>, audioUrl: string): boolean =>
  urls.has(canonicalUrl(audioUrl))
