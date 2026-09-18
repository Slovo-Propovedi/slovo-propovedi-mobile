import { audioCacheService } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { isOnlineAtom } from 'shared/model/network'
import { currentAudioAtom } from '../model'
import { playerService } from './PlayerService'
import { startBackgroundCaching } from './PlayerService/BackgroundCachingService'

export const recoverAfterReconnect = async (): Promise<void> => {
  const audioUrl = ctx.get(currentAudioAtom)?.audioUrl
  if (!audioUrl) return
  const isCached = await audioCacheService.isCached(audioUrl)
  // Track may have switched while the cache check was in flight
  if (ctx.get(currentAudioAtom)?.audioUrl !== audioUrl) return
  if (!isCached) startBackgroundCaching(audioUrl)
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
