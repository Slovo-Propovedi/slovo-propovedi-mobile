import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type ColorValue, StyleSheet, TouchableOpacity, View } from 'react-native'
import { ErrorModal } from 'shared/ui/error-modal'
import { useTheme } from 'shared/ui/theme'
import { playlistCacheService, type TrackToCache } from '../lib/PlaylistCacheService'
import { usePlaylistCacheMenu } from '../lib/usePlaylistCacheMenu'
import { PlaylistCacheDialogs } from './PlaylistCacheDialogs'
import { PlaylistCacheMenuDropdown } from './PlaylistCacheMenuDropdown'

const ICON_SIZE = 24
const BUTTON_SIZE = 44

export interface PlaylistCacheMenuProps {
  disabled?: boolean
  iconColor?: ColorValue
  playlistTitle: string
  tracksData: TrackToCache[]
}

export const PlaylistCacheMenu = ({
  disabled = false,
  iconColor,
  playlistTitle,
  tracksData,
}: PlaylistCacheMenuProps) => {
  const { currentTheme } = useTheme()
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
          <MaterialCommunityIcons
            size={ICON_SIZE}
            name='dots-vertical'
            color={iconColor ?? currentTheme.text}
          />
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

      <PlaylistCacheDialogs
        tracksData={tracksData}
        cachedCount={cachedCount}
        cacheDialogVisible={cacheDialogVisible}
        clearDialogVisible={clearDialogVisible}
        onCacheAllConfirm={handleCacheAllConfirm}
        onClearCacheConfirm={handleClearCacheConfirm}
        onCacheCancel={() => setCacheDialogVisible(false)}
        onClearCancel={() => setClearDialogVisible(false)}
      />
      <ErrorModal error={error} visible={error !== null} onClose={handleErrorClose} />
    </>
  )
}
const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: BUTTON_SIZE,
    justifyContent: 'center',
    width: BUTTON_SIZE,
  },
  buttonDisabled: { opacity: 0.5 },
})
