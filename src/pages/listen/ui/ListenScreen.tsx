import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import Animated from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { SearchIsland } from 'widgets/search-island'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { useTourActionRegistrar, useTourScrollable } from 'features/onboarding'
import {
  SearchGroupedResults,
  useIsSearchActive,
  useOpenSearch,
  useSearchUrlSync,
  useSermonPlayback,
} from 'features/sermon-search'
import { isSearchOpenAtom } from 'features/sermon-search/@x/suspension'
import { authStatusAtom, authUserAtom, canAccessAdmin, restoreSession } from 'entities/auth'
import { isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { createRefreshControl, PullToRefresh } from 'shared/ui'
import { tabBarHeightAtom, useBarCollapseOnScroll } from 'shared/ui/layout'
import { PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { useListenSearchNavigation } from '../lib/useListenSearchNavigation'
import { usePullToRefresh } from '../lib/usePullToRefresh'
import { useSearchTourActions } from '../lib/useSearchTourActions'
import { DynamicSectionsSlider } from './DynamicSectionsSlider'
import { styles } from './ListenScreen.styles'
import { ListenTopRow } from './ListenTopRow'
import { MyPlaylistsSlider } from './MyPlaylistsSlider'
import {
  wrapFirstSearchRow,
  wrapSearchGroupHeader,
  wrapSearchPicker,
  wrapSearchRowMenuButton,
} from './searchResultTargets'

const CLOSE_SERMON_PICKER_ACTION_ID = 'close-sermon-playlist-picker'

export const ListenScreen = () => {
  const insets = useSafeAreaInsets()
  const { currentTheme } = useTheme()
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  const [isPlayerExpanded] = useAtom(isPlayerExpandedAtom)
  const isSearchActive = useIsSearchActive()
  const openSearch = useOpenSearch()
  useSearchUrlSync()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { onScroll } = useBarCollapseOnScroll({ isSuspended: isSearchOpen || isPlayerExpanded })
  const [authStatus] = useAtom(authStatusAtom)
  const [authUser] = useAtom(authUserAtom)
  const restore = useAction(restoreSession)
  const { modal, openAddToPlaylist } = useAddToPlaylistModal()
  const {
    closePicker,
    modal: sermonPlaybackModal,
    onSermonPress,
  } = useSermonPlayback({
    pickerWrapper: wrapSearchPicker,
  })
  useSearchTourActions({ onOpenSearch: openSearch, onPressFirstSermon: onSermonPress })
  useTourActionRegistrar(CLOSE_SERMON_PICKER_ACTION_ID, closePicker)
  const { isRefreshing, refresh } = usePullToRefresh()
  const { onPlaylistPress, onPreacherPress, onShowAllGroup } = useListenSearchNavigation()
  const tourScrollableRef = useTourScrollable()

  useEffect(() => {
    if (authStatus !== 'idle') return

    void restore()
  }, [authStatus, restore])

  const canOpenAdminPanel = authStatus === 'authenticated' && canAccessAdmin(authUser)
  const showAdminButton = canOpenAdminPanel && !isSearchOpen

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[
        styles.safeArea,
        { backgroundColor: currentTheme.background, paddingTop: insets.top },
      ]}
    >
      {isSearchOpen && isSearchActive ? (
        <SearchGroupedResults
          onShowAllGroup={onShowAllGroup}
          pickerWrapper={wrapSearchPicker}
          onPlaylistPress={onPlaylistPress}
          onPreacherPress={onPreacherPress}
          onAddToPlaylist={openAddToPlaylist}
          firstRowWrapper={wrapFirstSearchRow}
          groupHeaderWrapper={wrapSearchGroupHeader}
          firstRowMenuButtonWrapper={wrapSearchRowMenuButton}
        />
      ) : (
        <PullToRefresh onRefresh={refresh} refreshing={isRefreshing}>
          <Animated.ScrollView
            onScroll={onScroll}
            ref={tourScrollableRef}
            scrollEventThrottle={16}
            keyboardDismissMode='on-drag'
            keyboardShouldPersistTaps='handled'
            style={[styles.scroll, { backgroundColor: currentTheme.background }]}
            refreshControl={createRefreshControl(isRefreshing, refresh, currentTheme.primary)}
            contentContainerStyle={[
              { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight },
            ]}
          >
            {!isSearchOpen && <ListenTopRow showAdminButton={showAdminButton} />}
            <DynamicSectionsSlider onboardingTargetId='listen.sections' />
            <MyPlaylistsSlider
              onboardingTargetId='listen.my-playlists'
              titleOnboardingTargetId='listen.my-playlists-title'
            />
          </Animated.ScrollView>
        </PullToRefresh>
      )}
      {isSearchOpen && <SearchIsland />}
      {modal}
      {sermonPlaybackModal}
    </SafeAreaView>
  )
}
