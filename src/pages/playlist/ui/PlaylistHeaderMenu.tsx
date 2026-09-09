import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { type ColorValue } from 'react-native'
import { type PlaylistData } from 'shared/model'
import { ErrorModal } from 'shared/ui/error-modal'
import { useTheme } from 'shared/ui/theme'
import { type TrackToCache } from '../lib/PlaylistCacheService'
import { usePlaylistCacheError } from '../lib/usePlaylistCacheError'
import { usePlaylistCacheMenu } from '../lib/usePlaylistCacheMenu'
import { usePlaylistHistoryMenu } from '../lib/usePlaylistHistoryMenu'
import { PlaylistCacheDialogs } from './PlaylistCacheDialogs'
import { PlaylistHeaderMenuDropdown } from './PlaylistHeaderMenuDropdown'
import { PlaylistHistoryDialogs } from './PlaylistHistoryDialogs'

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
  } = usePlaylistCacheMenu(tracksData, playlistTitle)

  const historyMenu = usePlaylistHistoryMenu(playlist, () => setMenuVisible(false))
  const { error, handleErrorClose } = usePlaylistCacheError(cacheDialogVisible)

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleOpenMenu}
          testID='playlist-header-menu'
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
        onCacheAll={handleCacheAllOption}
        onStopCaching={handleStopCaching}
        canMarkAll={historyMenu.canMarkAll}
        onClearCache={handleClearCacheOption}
        onClose={() => setMenuVisible(false)}
        isCacheAllDisabled={isCacheAllDisabled}
        onMarkAll={historyMenu.handleMarkAllOption}
        isClearCacheDisabled={isClearCacheDisabled}
        onRemoveFromHistory={historyMenu.handleRemoveOption}
        canRemoveFromHistory={historyMenu.canRemoveFromHistory}
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
