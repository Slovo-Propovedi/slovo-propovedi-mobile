import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import {
  SEARCH_HEADER_HEIGHT,
  SearchBar,
  SearchToggleButton,
  SermonSearchResults,
  useIsSearchActive,
  useIsSearchOpen,
} from 'features/sermon-search'
import { authStatusAtom, authUserAtom, canAccessAdmin, restoreSession } from 'entities/auth'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, MIN_TOUCH_TARGET, PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { useScrollActivity } from '../lib/useScrollActivity'
import { AdminShieldButton } from './AdminShieldButton'
import { ContinueListeningButton } from './ContinueListeningButton'
import { DynamicSectionsSlider } from './DynamicSectionsSlider'
import { MyPlaylistsSlider } from './MyPlaylistsSlider'

export const ListenScreen = () => {
  const { currentTheme } = useTheme()
  const isSearchOpen = useIsSearchOpen()
  const isSearchActive = useIsSearchActive()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const [authStatus] = useAtom(authStatusAtom)
  const [authUser] = useAtom(authUserAtom)
  const restore = useAction(restoreSession)
  const { onScroll } = useScrollActivity()
  const { modal, openAddToPlaylist } = useAddToPlaylistModal()

  useEffect(() => {
    if (authStatus !== 'idle') return

    void restore()
  }, [authStatus, restore])

  const canOpenAdminPanel = authStatus === 'authenticated' && canAccessAdmin(authUser)
  const showAdminButton = canOpenAdminPanel && !isSearchOpen

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: currentTheme.background }]}
    >
      {showAdminButton && (
        <View style={styles.adminButtonSlot}>
          <AdminShieldButton />
        </View>
      )}
      {isSearchOpen && (
        <View style={styles.searchHeader}>
          <SearchBar />
        </View>
      )}
      {isSearchOpen && isSearchActive ? (
        <SermonSearchResults onAddToPlaylist={openAddToPlaylist} />
      ) : (
        <ScrollView
          onScroll={onScroll}
          keyboardDismissMode='on-drag'
          keyboardShouldPersistTaps='handled'
          style={[styles.scroll, { backgroundColor: currentTheme.background }]}
          contentContainerStyle={[{ paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight }]}
        >
          {!isSearchOpen && <SearchToggleButton />}
          <DynamicSectionsSlider
            leadingElement={!isSearchActive ? <ContinueListeningButton /> : undefined}
          />
          <MyPlaylistsSlider />
        </ScrollView>
      )}
      {modal}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  adminButtonSlot: {
    // Center the 48pt shield on the pinned search row (SEARCH_HEADER_HEIGHT).
    position: 'absolute',
    right: INDENTS.medium,
    top: (SEARCH_HEADER_HEIGHT - MIN_TOUCH_TARGET) / 2,
    zIndex: 2,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  searchHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    height: SEARCH_HEADER_HEIGHT,
    zIndex: 1,
  },
})
