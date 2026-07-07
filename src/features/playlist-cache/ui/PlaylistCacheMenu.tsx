import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAtom, useCtx } from '@reatom/npm-react'
import { useCallback, useRef, useState } from 'react'
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native'
import { cacheUpdateTriggerAtom, isCachingPlaylistAtom } from 'features/playlist-cache/model'
import { audioCacheService } from 'shared/lib/audio-cache'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { COLORS } from 'shared/ui/themed'
import { playlistCacheService, type TrackToCache, usePlaylistCacheStatus } from '../lib'
import { PlaylistCacheMenuDropdown } from './PlaylistCacheMenuDropdown'

const ICON_SIZE = 24
const BUTTON_SIZE = 44

export interface PlaylistCacheMenuProps {
  disabled?: boolean
  tracksData: TrackToCache[]
}

export const PlaylistCacheMenu = ({ disabled = false, tracksData }: PlaylistCacheMenuProps) => {
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
    void playlistCacheService.cachePlaylist(ctx, tracksData)
  }, [ctx, tracksData])
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
    buttonRef.current?.measureInWindow((x, y, width, height) => {
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

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <TouchableOpacity
          onPress={handleOpenMenu}
          disabled={isMenuDisabled}
          testID='playlist-cache-menu'
          accessibilityLabel='Меню кеширования'
          accessibilityHint='Нажмите чтобы открыть меню'
          style={[styles.button, isMenuDisabled && styles.buttonDisabled]}
        >
          <MaterialCommunityIcons size={ICON_SIZE} color={COLORS.text} name='dots-vertical' />
        </TouchableOpacity>
      </View>

      <PlaylistCacheMenuDropdown
        visible={menuVisible}
        allCached={allCached}
        menuPosition={menuPosition}
        onCacheAll={handleCacheAllOption}
        onClearCache={handleClearCacheOption}
        onClose={() => setMenuVisible(false)}
        isCacheAllDisabled={isCacheAllDisabled}
        isClearCacheDisabled={cachedCount === 0}
      />

      <ConfirmDialog
        cancelText='Отмена'
        visible={cacheDialogVisible}
        confirmColor={COLORS.primary}
        title='Кеширование плейлиста'
        onConfirm={handleCacheAllConfirm}
        confirmText='Закешировать весь плейлист'
        onCancel={() => setCacheDialogVisible(false)}
        message={`Загрузить все треки (${tracksData.length}) для прослушивания без интернета?`}
      />
      <ConfirmDialog
        cancelText='Отмена'
        title='Удаление кеша'
        confirmText='Удалить всё'
        visible={clearDialogVisible}
        confirmColor={COLORS.primary}
        onConfirm={handleClearCacheConfirm}
        onCancel={() => setClearDialogVisible(false)}
        message={`Удалить ${cachedCount} закешированных треков из кеша?`}
      />
    </>
  )
}

export default PlaylistCacheMenu

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: BUTTON_SIZE,
    justifyContent: 'center',
    width: BUTTON_SIZE,
  },
  buttonDisabled: { opacity: 0.5 },
})
