import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import Animated from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTourScrollable } from 'features/onboarding'
import { useSearchUrlSync } from 'features/sermon-search'
import { useIsBarCollapseSuspended } from 'features/sermon-search/@x/suspension'
import { authStatusAtom, authUserAtom, canAccessAdmin, restoreSession } from 'entities/auth'
import { BLUR_TARGET_ROUTES, BlurBackdrop, createRefreshControl, PullToRefresh } from 'shared/ui'
import { tabBarHeightAtom, useBarCollapseOnScroll } from 'shared/ui/layout'
import { PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { usePullToRefresh } from '../lib/usePullToRefresh'
import { DynamicSectionsSlider } from './DynamicSectionsSlider'
import { styles } from './ListenScreen.styles'
import { ListenTopRow } from './ListenTopRow'
import { MyPlaylistsSlider } from './MyPlaylistsSlider'

export const ListenScreen = () => {
  const insets = useSafeAreaInsets()
  const { currentTheme } = useTheme()
  const isBarCollapseSuspended = useIsBarCollapseSuspended()
  // Web-only deep link (`/listen?search=`) and URL mirror: the search overlay
  // itself is global (SearchGate); only the listen route owns the URL param.
  useSearchUrlSync()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { onContentSizeChange, onScroll } = useBarCollapseOnScroll({
    isSuspended: isBarCollapseSuspended,
  })
  const [authStatus] = useAtom(authStatusAtom)
  const [authUser] = useAtom(authUserAtom)
  const restore = useAction(restoreSession)
  const { isRefreshing, refresh } = usePullToRefresh()
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
      </SafeAreaView>
    </BlurBackdrop>
  )
}
