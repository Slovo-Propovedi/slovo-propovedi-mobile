import { audioCacheService, isUrlQueuedOrActive } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { isOnlineAtom } from 'shared/model/network'
import { currentAudioAtom } from '../model'
import { playerService } from './PlayerService'
import { startBackgroundCaching } from './PlayerService/BackgroundCachingService'

const SETTLE_POLL_INTERVAL_MS = 1000
const SETTLE_POLL_TIMEOUT_MS = 5 * 60 * 1000

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/**
 * The reconnect edge can fire while the failing download is still inside its
 * bounded retry loop; if that loop settles-failed afterwards, nothing else
 * re-arms the download. Poll until the queue releases the URL, then re-check
 * and re-enqueue (Issue #109).
 * @param audioUrl - Network URL of the track to re-arm caching for.
 */
const restartCachingWhenSettled = async (audioUrl: string): Promise<void> => {
  let waitedMs = 0
  // Early-exit the poll when the track switched — the settle wait must not
  // outlive the track it was scheduled for.
  while (
    ctx.get(currentAudioAtom)?.audioUrl === audioUrl &&
    isUrlQueuedOrActive(audioUrl) &&
    waitedMs < SETTLE_POLL_TIMEOUT_MS
  ) {
    await sleep(SETTLE_POLL_INTERVAL_MS)
    waitedMs += SETTLE_POLL_INTERVAL_MS
  }
  if (isUrlQueuedOrActive(audioUrl)) {
    console.warn('[reconnectRecovery] download still active after settle timeout:', audioUrl)
    return
  }
  if (ctx.get(currentAudioAtom)?.audioUrl !== audioUrl) return
  try {
    const isCached = await audioCacheService.isCached(audioUrl)
    if (!isCached && !isUrlQueuedOrActive(audioUrl)) startBackgroundCaching(audioUrl)
  } catch (error) {
    console.warn('[reconnectRecovery] re-enqueue check failed:', error)
  }
}

export const recoverAfterReconnect = async (): Promise<void> => {
  const audioUrl = ctx.get(currentAudioAtom)?.audioUrl
  if (!audioUrl) return
  const isCached = await audioCacheService.isCached(audioUrl)
  // Track may have switched while the cache check was in flight
  if (ctx.get(currentAudioAtom)?.audioUrl !== audioUrl) return
  if (!isCached && !isUrlQueuedOrActive(audioUrl)) startBackgroundCaching(audioUrl)
  else if (!isCached) void restartCachingWhenSettled(audioUrl)
  try {
    await playerService.recoverStreamAfterReconnect(audioUrl)
  } catch (error) {
    console.error('[reconnectRecovery] stream heal failed:', error)
  }
}

export const setupReconnectRecovery = (): (() => void) => {
  try {
    // Seed BEFORE subscribing: ctx.subscribe fires immediately with the current value
    let wasOnline = ctx.get(isOnlineAtom)
    return ctx.subscribe(isOnlineAtom, isOnline => {
      const restored = isOnline && !wasOnline
      wasOnline = isOnline
      if (restored) void recoverAfterReconnect()
    })
  } catch (error) {
    console.error('[reconnectRecovery] setup failed:', error)
    return () => {}
  }
}
