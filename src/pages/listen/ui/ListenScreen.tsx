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
import { createRefreshControl, PullToRefresh } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { usePullToRefresh } from '../lib/usePullToRefresh'
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
  const { isRefreshing, refresh } = usePullToRefresh()

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
      {isSearchOpen && (
        <View style={styles.searchHeader}>
          <SearchBar />
        </View>
      )}
      {isSearchOpen && isSearchActive ? (
        <SermonSearchResults onAddToPlaylist={openAddToPlaylist} />
      ) : (
        <PullToRefresh onRefresh={refresh} refreshing={isRefreshing}>
          <ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyboardDismissMode='on-drag'
            keyboardShouldPersistTaps='handled'
            style={[styles.scroll, { backgroundColor: currentTheme.background }]}
            refreshControl={createRefreshControl(isRefreshing, refresh, currentTheme.primary)}
            contentContainerStyle={[
              { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight },
            ]}
          >
            {!isSearchOpen && (
              <View style={styles.topRow}>
                <SearchToggleButton />
                {showAdminButton && <AdminShieldButton />}
              </View>
            )}
            <DynamicSectionsSlider
              leadingElement={!isSearchActive ? <ContinueListeningButton /> : undefined}
            />
            <MyPlaylistsSlider />
          </ScrollView>
        </PullToRefresh>
      )}
      {modal}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: INDENTS.low,
  },
})
