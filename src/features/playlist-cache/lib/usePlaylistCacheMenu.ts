import { useAtom, useCtx } from '@reatom/npm-react'
import { useCallback, useRef, useState } from 'react'
import { Dimensions, type View } from 'react-native'
import { cacheUpdateTriggerAtom, isCachingPlaylistAtom } from 'features/playlist-cache/model'
import { audioCacheService } from 'shared/lib/audio-cache'
import { playlistCacheService, type TrackToCache } from './PlaylistCacheService'
import { usePlaylistCacheStatus } from './usePlaylistCacheStatus'

export const usePlaylistCacheMenu = (
  tracksData: TrackToCache[],
  playlistTitle: string,
  disabled?: boolean,
) => {
  const ctx = useCtx()
  const [isCaching] = useAtom(isCachingPlaylistAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)
  const [cacheDialogVisible, setCacheDialogVisible] = useState(false)
  const [clearDialogVisible, setClearDialogVisible] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ right: 0, top: 0 })
  const buttonRef = useRef<View>(null)

  const { allCached, cachedCount } = usePlaylistCacheStatus(tracksData, cacheTrigger)
  const isMenuDisabled = disabled || isCaching
  const isCacheAllDisabled = isCaching || allCached

  const handleCacheAllConfirm = useCallback(() => {
    setCacheDialogVisible(false)
    void playlistCacheService.cachePlaylist(ctx, tracksData, playlistTitle)
  }, [ctx, playlistTitle, tracksData])

  const handleClearCacheConfirm = useCallback(async () => {
    setClearDialogVisible(false)
    try {
      await audioCacheService.clearCache()
      cacheUpdateTriggerAtom(ctx, prev => prev + 1)
    } catch (error) {
      console.error('[PlaylistCacheMenu] Error clearing cache:', error)
    }
  }, [ctx])

  const handleOpenMenu = useCallback(() => {
    buttonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      const { width: screenWidth } = Dimensions.get('window')
      setMenuPosition({ right: screenWidth - x - width, top: y + height })
      setMenuVisible(true)
    })
  }, [])

  const handleCacheAllOption = useCallback(() => {
    setMenuVisible(false)
    setCacheDialogVisible(true)
  }, [])

  const handleClearCacheOption = useCallback(() => {
    setMenuVisible(false)
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
    isCacheAllDisabled,
    isMenuDisabled,
    menuPosition,
    menuVisible,
    setCacheDialogVisible,
    setClearDialogVisible,
    setMenuVisible,
  }
}
