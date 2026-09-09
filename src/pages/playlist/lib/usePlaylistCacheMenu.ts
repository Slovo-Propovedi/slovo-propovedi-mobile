import { useAtom, useCtx } from '@reatom/npm-react'
import { useCallback, useRef, useState } from 'react'
import { type View } from 'react-native'
import {
  activeCacheUrlAtom,
  audioCacheService,
  cacheQueueAtom,
  hasInflightCacheDownloads,
} from 'shared/lib/audio-cache'
import {
  cacheUpdateTriggerAtom,
  clearCachedUrls,
  incrementCacheTrigger,
} from 'shared/lib/cache-triggers'
import { isOnlineAtom } from 'shared/model'
import { type AnchorRect } from 'shared/ui/anchored-dropdown'
import { isCachingPlaylistAtom } from '../model'
import { playlistCacheService, type TrackToCache } from './PlaylistCacheService'
import { usePlaylistCacheStatus } from './usePlaylistCacheStatus'

export const usePlaylistCacheMenu = (tracksData: TrackToCache[], playlistTitle: string) => {
  const ctx = useCtx()
  const [isOnline] = useAtom(isOnlineAtom)
  const [isCaching] = useAtom(isCachingPlaylistAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)
  const [queue] = useAtom(cacheQueueAtom)
  const [activeUrl] = useAtom(activeCacheUrlAtom)
  const [cacheDialogVisible, setCacheDialogVisible] = useState(false)
  const [clearDialogVisible, setClearDialogVisible] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<AnchorRect | null>(null)
  const buttonRef = useRef<View>(null)

  const { allCached, cachedCount } = usePlaylistCacheStatus(tracksData, cacheTrigger)
  const isCacheAllDisabled = allCached || !isOnline
  const isQueueNonEmpty = Object.keys(queue).length > 0
  const isClearCacheDisabled = cachedCount === 0 || isQueueNonEmpty || activeUrl !== null

  const handleCacheAllConfirm = useCallback(() => {
    setCacheDialogVisible(false)
    void playlistCacheService.cachePlaylist(ctx, tracksData, playlistTitle)
  }, [ctx, playlistTitle, tracksData])

  const handleClearCacheConfirm = useCallback(async () => {
    setClearDialogVisible(false)
    // Press-time belt-and-suspenders on a destructive op: the reactive source
    // (activeCacheUrlAtom + cacheQueueAtom) drives the disabled state, but the
    // imperative getter re-checks any inflight download at the moment of clear.
    if (hasInflightCacheDownloads()) return
    try {
      await audioCacheService.clearCache()
      clearCachedUrls(ctx)
      incrementCacheTrigger(ctx)
    } catch (error) {
      console.error('[PlaylistHeaderMenu] Error clearing cache:', error)
    }
  }, [ctx])

  const handleStopCaching = useCallback(() => {
    playlistCacheService.cancelPlaylistCache(ctx)
  }, [ctx])

  const handleOpenMenu = useCallback(() => {
    buttonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMenuAnchor({ height, width, x, y })
      setMenuVisible(true)
    })
  }, [])

  const handleCacheAllOption = useCallback(() => {
    setMenuVisible(false)
    setCacheDialogVisible(true)
  }, [])

  const handleClearCacheOption = useCallback(() => {
    setMenuVisible(false)
    // Press-time belt-and-suspenders (see handleClearCacheConfirm).
    if (hasInflightCacheDownloads()) return
    setClearDialogVisible(true)
  }, [])

  return {
    allCached,
    buttonRef,
    cachedCount,
    cacheDialogVisible,
    clearDialogVisible,
    handleCacheAllConfirm,
    handleCacheAllOption,
    handleClearCacheConfirm,
    handleClearCacheOption,
    handleOpenMenu,
    handleStopCaching,
    isCacheAllDisabled,
    isCaching,
    isClearCacheDisabled,
    menuAnchor,
    menuVisible,
    setCacheDialogVisible,
    setClearDialogVisible,
    setMenuVisible,
  }
}
