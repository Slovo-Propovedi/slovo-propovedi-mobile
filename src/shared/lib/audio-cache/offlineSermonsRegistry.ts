import { action, atom, type Ctx } from '@reatom/framework'
import z from 'zod'
import { OFFLINE_SERMONS_REGISTRY } from 'shared/config'
import { getCachedJson, setCachedJson } from 'shared/lib/cache'
import {
  type PlaylistData,
  playlistDataSchema,
  type SermonData,
  sermonDataSchema,
} from 'shared/model'

export const offlineSermonEntrySchema = z.object({
  playlist: playlistDataSchema.nullable(),
  registeredAt: z.number(),
  sermon: sermonDataSchema,
})

export const offlineSermonsRegistrySchema = z.record(z.string(), offlineSermonEntrySchema)

export type OfflineSermonEntry = z.infer<typeof offlineSermonEntrySchema>
export type OfflineSermonsRegistry = z.infer<typeof offlineSermonsRegistrySchema>

// Persistent registry of cached audio URLs → sermon + playlist metadata.
// The authoritative source for the Offline screen: unlike the session-only
// cachedUrlsAtom overlay, it survives restarts and does not depend on metadata
// still being present in history/sections/search caches.
export const offlineRegistryAtom = atom<OfflineSermonsRegistry>({}, 'offlineRegistryAtom')

// Serialized writes: the last registration always wins (no interleaved stale writes).
let persistChain: Promise<void> = Promise.resolve()

const persistRegistry = (registry: OfflineSermonsRegistry): void => {
  persistChain = persistChain
    .catch(() => {})
    .then(() => setCachedJson(OFFLINE_SERMONS_REGISTRY, registry))
    .catch(error => {
      console.warn('[offlineSermonsRegistry] persist failed:', error)
    })
}

// Resolves when all pending registry writes have settled (used by the seed
// before setting the seeded flag, and by tests).
export const flushOfflineRegistryPersist = (): Promise<void> => persistChain

export const hydrateOfflineRegistry = async (ctx: Ctx): Promise<void> => {
  const registry = await getCachedJson(OFFLINE_SERMONS_REGISTRY, offlineSermonsRegistrySchema)
  if (!registry) return

  await ctx.schedule(() => {
    offlineRegistryAtom(ctx, registry)
  })
}

export const registerOfflineSermon = action(
  (ctx: Ctx, url: string, sermon: SermonData, playlist: null | PlaylistData) => {
    const registry = ctx.get(offlineRegistryAtom)
    const existing = registry[url]

    // registeredAt is always fresh; compare only the metadata to detect real changes.
    if (
      existing &&
      JSON.stringify(existing.sermon) === JSON.stringify(sermon) &&
      JSON.stringify(existing.playlist) === JSON.stringify(playlist)
    )
      return existing

    const next = { ...registry, [url]: { playlist, registeredAt: Date.now(), sermon } }
    offlineRegistryAtom(ctx, next)
    persistRegistry(next)
    return next[url]
  },
  'registerOfflineSermon',
)

export const removeOfflineSermon = action((ctx: Ctx, url: string) => {
  const registry = ctx.get(offlineRegistryAtom)
  if (!Object.hasOwn(registry, url)) return registry

  const next = { ...registry }
  delete next[url]
  offlineRegistryAtom(ctx, next)
  persistRegistry(next)
  return next
}, 'removeOfflineSermon')

export const clearOfflineRegistry = action((ctx: Ctx) => {
  const registry = ctx.get(offlineRegistryAtom)
  if (Object.keys(registry).length === 0) return registry

  offlineRegistryAtom(ctx, {})
  persistRegistry({})
  return {}
}, 'clearOfflineRegistry')
