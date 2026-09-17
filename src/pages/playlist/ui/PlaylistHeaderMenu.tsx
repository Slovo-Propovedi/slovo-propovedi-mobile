import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { type ColorValue } from 'react-native'
import { type PlaylistData } from 'shared/model'
import { ErrorModal } from 'shared/ui/error-modal'
import { useTheme } from 'shared/ui/theme'
import { type TrackToCache } from '../lib/PlaylistOfflineService'
import { usePlaylistCacheError } from '../lib/usePlaylistCacheError'
import { usePlaylistHistoryMenu } from '../lib/usePlaylistHistoryMenu'
import { usePlaylistOfflineMenu } from '../lib/usePlaylistOfflineMenu'
import { PlaylistHeaderMenuDropdown } from './PlaylistHeaderMenuDropdown'
import { PlaylistHistoryDialogs } from './PlaylistHistoryDialogs'
import { PlaylistOfflineDialogs } from './PlaylistOfflineDialogs'

const ICON_SIZE = 24
const BUTTON_SIZE = 44

export interface PlaylistHeaderMenuProps {
  iconColor?: ColorValue
  playlist: PlaylistData
  playlistTitle: string
  tracksData: TrackToCache[]
}

export const PlaylistHeaderMenu = ({
  iconColor,
  playlist,
  playlistTitle,
  tracksData,
}: PlaylistHeaderMenuProps) => {
  const { currentTheme } = useTheme()

  const {
    allCached,
    buttonRef,
    cachedCount,
    cacheDialogVisible,
    clearDialogVisible,
    handleAddAllToOfflineConfirm,
    handleAddAllToOfflineOption,
    handleClearCacheConfirm,
    handleClearCacheOption,
    handleOpenMenu,
    handleStopCaching,
    isAddAllToOfflineDisabled,
    isCaching,
    isClearCacheDisabled,
    menuAnchor,
    menuVisible,
    setCacheDialogVisible,
    setClearDialogVisible,
    setMenuVisible,
  } = usePlaylistOfflineMenu(tracksData, playlistTitle)

  const historyMenu = usePlaylistHistoryMenu(playlist, () => setMenuVisible(false))
  const { error, handleErrorClose } = usePlaylistCacheError(cacheDialogVisible)

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleOpenMenu}
          accessibilityRole='button'
          accessibilityLabel='Меню плейлиста'
          accessibilityHint='Нажмите чтобы открыть меню'
        >
          <MaterialCommunityIcons
            size={ICON_SIZE}
            name='dots-vertical'
            color={iconColor ?? currentTheme.text}
          />
        </TouchableOpacity>
      </View>

      <PlaylistHeaderMenuDropdown
        anchor={menuAnchor}
        visible={menuVisible}
        allCached={allCached}
        isCaching={isCaching}
        onStopCaching={handleStopCaching}
        canMarkAll={historyMenu.canMarkAll}
        onClearCache={handleClearCacheOption}
        onClose={() => setMenuVisible(false)}
        onMarkAll={historyMenu.handleMarkAllOption}
        isClearCacheDisabled={isClearCacheDisabled}
        onAddAllToOffline={handleAddAllToOfflineOption}
        onRemoveFromHistory={historyMenu.handleRemoveOption}
        isAddAllToOfflineDisabled={isAddAllToOfflineDisabled}
        canRemoveFromHistory={historyMenu.canRemoveFromHistory}
      />

      <PlaylistOfflineDialogs
        tracksData={tracksData}
        cachedCount={cachedCount}
        cacheDialogVisible={cacheDialogVisible}
        clearDialogVisible={clearDialogVisible}
        onClearCacheConfirm={handleClearCacheConfirm}
        onClearCancel={() => setClearDialogVisible(false)}
        onAddAllToOfflineConfirm={handleAddAllToOfflineConfirm}
        onAddToOfflineCancel={() => setCacheDialogVisible(false)}
      />

      <PlaylistHistoryDialogs
        onMarkConfirm={historyMenu.handleMarkAllConfirm}
        markDialogVisible={historyMenu.markDialogVisible}
        onRemoveConfirm={historyMenu.handleRemoveConfirm}
        removeDialogVisible={historyMenu.removeDialogVisible}
        onMarkCancel={() => historyMenu.setMarkDialogVisible(false)}
        onRemoveCancel={() => historyMenu.setRemoveDialogVisible(false)}
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
})
