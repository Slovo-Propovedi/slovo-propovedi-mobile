import { ctx } from '../reatom-ctx'
import { activeCacheUrlAtom, cacheQueueAtom } from './cacheQueueState'

// True while the URL waits in the serial queue or is the active download.
// Such downloads self-heal via the retry loop's waitForOnline once the
// network is honestly back — re-enqueueing would only join a dying promise.
export const isUrlQueuedOrActive = (audioUrl: string): boolean =>
  audioUrl in ctx.get(cacheQueueAtom) || ctx.get(activeCacheUrlAtom) === audioUrl
