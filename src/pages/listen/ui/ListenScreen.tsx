import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useEffect, useRef } from 'react'
import Animated from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { useTourActionRegistrar, useTourScrollable } from 'features/onboarding'
import { useOpenSearch, useSearchUrlSync, useSermonPlayback } from 'features/sermon-search'
import { isSearchOpenAtom, useIsBarCollapseSuspended } from 'features/sermon-search/@x/suspension'
import { authStatusAtom, authUserAtom, canAccessAdmin, restoreSession } from 'entities/auth'
import { type SermonData } from 'entities/sermon'
import { BLUR_TARGET_ROUTES, BlurBackdrop, createRefreshControl, PullToRefresh } from 'shared/ui'
import { tabBarHeightAtom, useBarCollapseOnScroll } from 'shared/ui/layout'
import { PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { SearchScreen } from '../../search'
import { wrapSearchPicker } from '../../search/ui/searchTargets'
import { useListenNavigation } from '../lib/useListenNavigation'
import { usePullToRefresh } from '../lib/usePullToRefresh'
import { useSearchTourActions } from '../lib/useSearchTourActions'
import { DynamicSectionsSlider } from './DynamicSectionsSlider'
import { styles } from './ListenScreen.styles'
import { ListenTopRow } from './ListenTopRow'
import { MyPlaylistsSlider } from './MyPlaylistsSlider'

const CLOSE_SERMON_PICKER_ACTION_ID = 'close-sermon-playlist-picker'

export const ListenScreen = () => {
  const insets = useSafeAreaInsets()
  const { currentTheme } = useTheme()
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  const isBarCollapseSuspended = useIsBarCollapseSuspended()
  const openSearch = useOpenSearch()
  useSearchUrlSync()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { onContentSizeChange, onScroll } = useBarCollapseOnScroll({
    isSuspended: isBarCollapseSuspended,
  })
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
  const firstSermonRef = useRef<SermonData | undefined>(undefined)
  const handleFirstSermonChange = useCallback((sermon: SermonData | undefined) => {
    firstSermonRef.current = sermon
  }, [])
  const getFirstSermon = useCallback(() => firstSermonRef.current, [])
  useSearchTourActions({
    getFirstSermon,
    onOpenSearch: openSearch,
    onPressFirstSermon: onSermonPress,
  })
  useTourActionRegistrar(CLOSE_SERMON_PICKER_ACTION_ID, closePicker)
  const { isRefreshing, refresh } = usePullToRefresh()
  const { navigateToPlaylist } = useListenNavigation()
  const tourScrollableRef = useTourScrollable()

  useEffect(() => {
    if (authStatus !== 'idle') return

    void restore()
  }, [authStatus, restore])

  const canOpenAdminPanel = authStatus === 'authenticated' && canAccessAdmin(authUser)

  return (
    <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.listen}>
      <SafeAreaView
        edges={['left', 'right']}
        style={[
          styles.safeArea,
          { backgroundColor: currentTheme.background, paddingTop: insets.top },
        ]}
      >
        {isSearchOpen ? (
          <SearchScreen
            onSermonPress={onSermonPress}
            onAddToPlaylist={openAddToPlaylist}
            onPlaylistPress={navigateToPlaylist}
            onFirstSermonChange={handleFirstSermonChange}
          />
        ) : (
          <PullToRefresh onRefresh={refresh} refreshing={isRefreshing}>
            <Animated.ScrollView
              onScroll={onScroll}
              ref={tourScrollableRef}
              scrollEventThrottle={16}
              keyboardDismissMode='on-drag'
              keyboardShouldPersistTaps='handled'
              onContentSizeChange={onContentSizeChange}
              style={[styles.scroll, { backgroundColor: currentTheme.background }]}
              refreshControl={createRefreshControl(isRefreshing, refresh, currentTheme.primary)}
              contentContainerStyle={[
                { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight },
              ]}
            >
              <ListenTopRow showAdminButton={canOpenAdminPanel} />
              <DynamicSectionsSlider onboardingTargetId='listen.sections' />
              <MyPlaylistsSlider
                onboardingTargetId='listen.my-playlists'
                titleOnboardingTargetId='listen.my-playlists-title'
              />
            </Animated.ScrollView>
          </PullToRefresh>
        )}
        {modal}
        {sermonPlaybackModal}
      </SafeAreaView>
    </BlurBackdrop>
  )
}
