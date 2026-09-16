import { type Ctx } from '@reatom/framework'
import { audioCacheService, registerOfflineSermon } from 'shared/lib/audio-cache'
import { reportError } from 'shared/model/error-dialog'
import { collectSermonItems } from './collectSermonItems'

// Registers a freshly cached URL in the persistent offline registry. Called
// from the cachedUrlsAtom watcher on every new download completion.
export const syncOfflineSermon = async (ctx: Ctx, url: string): Promise<void> => {
  try {
    const isCached = await audioCacheService.isCached(url).catch(() => false)
    if (!isCached) return

    const items = await collectSermonItems(ctx)
    const item = items.find(candidate => candidate.sermon.audioUrl === url)
    if (!item) return

    registerOfflineSermon(ctx, url, item.sermon, item.playlist)
  } catch (error) {
    reportError(error, 'Не удалось сохранить офлайн-проповедь')
  }
}
