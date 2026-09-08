import { action, type Ctx } from '@reatom/framework'
import { inflightIsJoinable, joinInflight, registerFresh } from './cacheQueueEnqueue'
import { addProgressCallback, addRequester } from './cacheQueueRegistries'
import { kickRunner } from './cacheQueueRunner'
import {
  cacheQueueAtom,
  type CacheQueueEntry,
  type CacheQueueSource,
  nextEnqueuedAt,
  pendingPromises,
} from './cacheQueueState'

/**
 * Enqueues many cache requests in a SINGLE cacheQueueAtom write (vs N writes for
 * N URLs), preserving FIFO by assigning enqueuedAt in array order. In-batch
 * duplicate URLs share the first occurrence's promise. Per-URL dedupe matches
 * `enqueueCache`: joins an already-queued promise, joins a non-aborted inflight
 * download, else starts fresh. An aborted inflight entry is treated as fresh so
 * a re-enqueued URL is re-downloaded instead of joining the dying promise.
 * @returns A promise per input URL, in input order.
 */
export const enqueueCacheMany = action(
  (
    ctx: Ctx,
    urls: string[],
    source: CacheQueueSource,
    onProgress?: (progress: number) => void,
  ): Promise<string>[] => {
    const freshEntries: Record<string, CacheQueueEntry> = {}
    const results: Promise<string>[] = []

    // Pre-validate the ENTIRE array before mutating any state. registerFresh
    // (below) has side effects (pendingPromises/requesters) and the atom write
    // happens only after the loop — a mid-array empty URL must not leave earlier
    // URLs stranded forever on dead deferreds.
    for (const url of urls) if (!url) throw new Error('[cacheQueue] audioUrl is required')

    for (const url of urls) {
      const queued = pendingPromises.get(url)
      if (queued) {
        addRequester(url, source)
        if (onProgress) addProgressCallback(url, onProgress)
        results.push(queued.promise)
        continue
      }
      if (inflightIsJoinable(url)) {
        results.push(joinInflight(url, source, onProgress))
        continue
      }

      const deferred = registerFresh(url, source, onProgress)
      freshEntries[url] = { enqueuedAt: nextEnqueuedAt(), source }
      results.push(deferred.promise)
    }

    if (Object.keys(freshEntries).length > 0) {
      cacheQueueAtom(ctx, prev => ({ ...prev, ...freshEntries }))
      kickRunner(ctx)
    }

    return results
  },
  'enqueueCacheMany',
)
