import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { ErrorModal } from 'shared/ui/error-modal'
import { COLORS } from 'shared/ui/themed'
import { playlistCacheService, type TrackToCache } from '../lib/PlaylistCacheService'
import { usePlaylistCacheMenu } from '../lib/usePlaylistCacheMenu'
import { PlaylistCacheMenuDropdown } from './PlaylistCacheMenuDropdown'

const ICON_SIZE = 24
const BUTTON_SIZE = 44

export interface PlaylistCacheMenuProps {
  disabled?: boolean
  playlistTitle: string
  tracksData: TrackToCache[]
}

export const PlaylistCacheMenu = ({
  disabled = false,
  playlistTitle,
  tracksData,
}: PlaylistCacheMenuProps) => {
  const [error, setError] = useState<Error | null>(null)
  const errorShownRef = useRef(false)
  const setErrorRef = useRef(setError)

  const {
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
  } = usePlaylistCacheMenu(tracksData, playlistTitle, disabled)

  useEffect(() => {
    setErrorRef.current = setError
  }, [setError])

  useEffect(() => {
    if (!errorShownRef.current) {
      const currentError = playlistCacheService.getError()
      if (currentError) {
        setErrorRef.current(currentError)
        errorShownRef.current = true
      }
    }
  }, [cacheDialogVisible])

  const handleErrorClose = useCallback(() => {
    playlistCacheService.clearError()
    setError(null)
    errorShownRef.current = false
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
      <ErrorModal error={error} visible={error !== null} onClose={handleErrorClose} />
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
