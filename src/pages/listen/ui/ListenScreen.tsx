import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import Animated from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTourScrollable } from 'features/onboarding'
import { useIsBarCollapseSuspended } from 'features/sermon-search/@x/suspension'
import { authStatusAtom, authUserAtom, canAccessAdmin, restoreSession } from 'entities/auth'
import {
  BLUR_TARGET_ROUTES,
  BlurBackdrop,
  createRefreshControl,
  PullToRefresh,
  WideTopActions,
} from 'shared/ui'
import { useBarCollapseOnScroll, useIsWideLayout, useScreenChromePadding } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { usePullToRefresh } from '../lib/usePullToRefresh'
import { DynamicSectionsSlider } from './DynamicSectionsSlider'
import { styles } from './ListenScreen.styles'
import { ListenTopActions } from './ListenTopActions'
import { ListenTopRow } from './ListenTopRow'
import { MyPlaylistsSlider } from './MyPlaylistsSlider'

export const ListenScreen = () => {
  const insets = useSafeAreaInsets()
  const { currentTheme } = useTheme()
  const isBarCollapseSuspended = useIsBarCollapseSuspended()
  const isWide = useIsWideLayout()
  const { bottomChromeHeight, topChromeScrollInset } = useScreenChromePadding()
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
          {
            backgroundColor: currentTheme.background,
            paddingTop: insets.top,
          },
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
            contentContainerStyle={[
              { paddingBottom: bottomChromeHeight, paddingTop: topChromeScrollInset },
            ]}
            refreshControl={createRefreshControl(
              isRefreshing,
              refresh,
              currentTheme.primary,
              topChromeScrollInset,
            )}
          >
            {!isWide && <ListenTopRow showAdminButton={canOpenAdminPanel} />}
            <DynamicSectionsSlider onboardingTargetId='listen.sections' />
            <MyPlaylistsSlider
              onboardingTargetId='listen.my-playlists'
              titleOnboardingTargetId='listen.my-playlists-title'
            />
          </Animated.ScrollView>
          <WideTopActions>
            <ListenTopActions showAdminButton={canOpenAdminPanel} />
          </WideTopActions>
        </PullToRefresh>
      </SafeAreaView>
    </BlurBackdrop>
  )
}
