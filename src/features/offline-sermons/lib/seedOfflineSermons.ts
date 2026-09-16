import { type Ctx } from '@reatom/framework'
import z from 'zod'
import { OFFLINE_SERMONS_REGISTRY_SEEDED } from 'shared/config'
import { flushOfflineRegistryPersist, registerOfflineSermon } from 'shared/lib/audio-cache'
import { getCachedJson, setCachedJson } from 'shared/lib/cache'
import { reportError } from 'shared/model/error-dialog'
import { collectSermonItems } from './collectSermonItems'
import { filterCachedSermons } from './filterCachedSermons'

const seededFlagSchema = z.boolean()

// One-time migration: backfill the persistent offline registry from the
// metadata sources that existed before the registry (history, sections, search,
// current player). Runs once per install; the flag is written only after a
// successful backfill so a failed run retries on the next launch.
export const seedOfflineSermons = async (ctx: Ctx): Promise<void> => {
  try {
    const seeded = await getCachedJson(OFFLINE_SERMONS_REGISTRY_SEEDED, seededFlagSchema)
    if (seeded) return

    const items = await filterCachedSermons(await collectSermonItems(ctx))
    for (const { playlist, sermon } of items)
      registerOfflineSermon(ctx, sermon.audioUrl, sermon, playlist)

    await flushOfflineRegistryPersist()
    await setCachedJson(OFFLINE_SERMONS_REGISTRY_SEEDED, true)
  } catch (error) {
    reportError(error, 'Не удалось восстановить список офлайн-проповедей')
  }
}
