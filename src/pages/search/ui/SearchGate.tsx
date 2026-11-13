import { useAction, useAtom } from '@reatom/npm-react'
import { usePathname } from 'expo-router'
import { useCallback, useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { useTourActionRegistrar } from 'features/onboarding'
import {
  isDetailRouteOverSearch,
  isSearchOpenAtom,
  setSearchOverlayHidden,
  useOpenSearch,
  useSermonPlayback,
} from 'features/sermon-search'
import { type SermonData } from 'entities/sermon'
import { isScreenTransitioningAtom } from 'shared/model'
import { BlurBackdrop } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { useSearchNavigation } from '../lib/useSearchNavigation'
import { useSearchOverlayConceal } from '../lib/useSearchOverlayConceal'
import { useSearchTourActions } from '../lib/useSearchTourActions'
import { SearchScreen } from './SearchScreen'
import { wrapSearchPicker } from './searchTargets'

const CLOSE_SERMON_PICKER_ACTION_ID = 'close-sermon-playlist-picker'

/**
 * Always-mounted search overlay for the tab layout. It stays below the bottom
 * chrome (zIndex 5 vs the bar's 10 and the player's 9/20) so the islands keep
 * floating above the search page on every screen. Hooks live outside the open
 * guard: the tour registers `open-listen-search` long before the overlay shows.
 *
 * Navigating to a detail route keeps the session ALIVE: the layer stays visible
 * while that screen slides in, then is hidden with `display: none` instead of
 * unmounting, so the query, active group and loaded pages survive and come back
 * untouched when the detail route pops. Closing the session (bar gesture /
 * hardware back on a tab root) still unmounts it, which is what resets the page
 * state.
 */
export const SearchGate = () => {
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const { currentTheme } = useTheme()
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  const [isTransitioning] = useAtom(isScreenTransitioningAtom)
  // Covered = a detail route owns the screen; conceal waits for its push
  // transition to finish so the overlay does not vanish before the page slides in.
  const isCovered = isSearchOpen && isDetailRouteOverSearch(pathname)
  const isConcealed = useSearchOverlayConceal(isCovered, isTransitioning)
  const setOverlayHidden = useAction(setSearchOverlayHidden)
  const openSearch = useOpenSearch()
  const { navigateToPlaylist, navigateToPreacher } = useSearchNavigation()
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

  // The field pill, bar suspension and chrome shade read this flag. The action
  // no-ops on an unchanged value, so the effect cannot loop.
  useEffect(() => {
    setOverlayHidden(isConcealed)
  }, [isConcealed, setOverlayHidden])

  if (!isSearchOpen) return null

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.layer, isConcealed && styles.hidden]}>
      {/* Surfaces floating over the page (the mini pill) resolve this target
          via the route stack; the tab-bar chrome keeps sampling its own shade.
          The themed background must live INSIDE the target, otherwise the
          pill's blur samples the window background (bright gray in dark).
          While concealed, the gate stops publishing so the detail page's own
          target wins; the subtree stays mounted. During the push it registers under the incoming route until conceal; chrome keeps its shade. */}
      <BlurBackdrop routeKey={pathname} disabled={isConcealed}>
        <View
          style={[
            styles.page,
            { backgroundColor: currentTheme.background, paddingTop: insets.top },
          ]}
        >
          <SearchScreen
            onSermonPress={onSermonPress}
            onAddToPlaylist={openAddToPlaylist}
            onPlaylistPress={navigateToPlaylist}
            onPreacherPress={navigateToPreacher}
            onFirstSermonChange={handleFirstSermonChange}
          />
        </View>
      </BlurBackdrop>
      {modal}
      {sermonPlaybackModal}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  // Hidden under a detail route: children stay mounted, touches fall through.
  hidden: {
    display: 'none',
  },
  // Full-cover layer inside the tab layout: above the Tabs screens, below the
  // bottom chrome (bar container zIndex 10, player root 9/20).
  layer: {
    bottom: 0,
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 5,
  },
  page: {
    flex: 1,
  },
})
