/**
 * Reading and parsing the web audio cache commit manifest (v2), including the
 * origin-rooted key. V1 manifests are demoted to `unverified` on read, so their
 * legacy entries cannot be trusted before `webCacheManifestMigration.ts`
 * verifies their body length.
 */

export const AUDIO_MANIFEST_KEY = '__manifest__'

export const manifestCacheKey = (): string =>
  new URL(AUDIO_MANIFEST_KEY, globalThis.location.origin).href

export interface ManifestState {
  unverified: string[]
  urls: Set<string>
}

const emptyState = (): ManifestState => ({ unverified: [], urls: new Set() })

const readStringList = (manifest: object, field: 'unverified' | 'urls'): string[] => {
  if (!(field in manifest)) return []
  const value: unknown = Reflect.get(manifest, field)
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

const isLegacyManifest = (manifest: object): boolean =>
  !('unverified' in manifest) || Reflect.get(manifest, 'version') === 1

const toManifestState = (manifest: object): ManifestState => {
  if (isLegacyManifest(manifest)) {
    const urls = readStringList(manifest, 'urls')
    // v1 trusted every entry; demote it to unverified until its length is proven.
    const unverified = [...new Set([...urls, ...readStringList(manifest, 'unverified')])]
    return { unverified, urls: new Set() }
  }
  const unverified = readStringList(manifest, 'unverified')
  return { unverified, urls: new Set(readStringList(manifest, 'urls')) }
}

const parseManifest = async (entry: Response): Promise<ManifestState> => {
  try {
    const manifest: unknown = await entry.json()
    if (typeof manifest !== 'object' || manifest === null) return emptyState()
    return toManifestState(manifest)
  } catch (error) {
    console.error('[audio-cache] Invalid manifest, treating as empty:', error)
    return emptyState()
  }
}

/**
 * Read the full manifest state; null means the entry is missing (distinct from
 * empty). A corrupt manifest counts as an empty state (logged), so callers retry.
 * @param cache - The audio cache bucket.
 */
export const readManifestEntry = async (cache: Cache): Promise<ManifestState | null> => {
  const entry = await cache.match(manifestCacheKey(), { ignoreVary: true })
  return entry ? parseManifest(entry) : null
}

/**
 * Read committed URLs plus the legacy URLs still awaiting body verification.
 * @param cache - The audio cache bucket.
 */
export const readManifestState = async (cache: Cache): Promise<ManifestState> => {
  const state = await readManifestEntry(cache)
  return state ?? emptyState()
}
