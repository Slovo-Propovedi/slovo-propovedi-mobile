import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useCallback, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { useTourActionRegistrar } from 'features/onboarding'
import { isSearchOpenAtom, useOpenSearch, useSermonPlayback } from 'features/sermon-search'
import { type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'
import { useNavigationGuard } from 'shared/routing'
import { useTheme } from 'shared/ui/theme'
import { useSearchTourActions } from '../lib/useSearchTourActions'
import { SearchScreen } from './SearchScreen'
import { wrapSearchPicker } from './searchTargets'

const CLOSE_SERMON_PICKER_ACTION_ID = 'close-sermon-playlist-picker'

/**
 * Always-mounted search overlay for the tab layout. It stays below the bottom
 * chrome (zIndex 5 vs the bar's 10 and the player's 9/20) so the islands keep
 * floating above the search page on every screen. Hooks live outside the open
 * guard: the tour registers `open-listen-search` long before the overlay shows.
 */
export const SearchGate = () => {
  const insets = useSafeAreaInsets()
  const { currentTheme } = useTheme()
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  const openSearch = useOpenSearch()
  const router = useRouter()
  const runGuarded = useNavigationGuard()
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

  const navigateToPlaylist = useCallback(
    (playlist: PlaylistData) => {
      runGuarded(() => {
        router.push({
          params: { playlist: playlist.id },
          pathname: '/listen/playlist',
        })
      })
    },
    [router, runGuarded],
  )

  if (!isSearchOpen) return null

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.layer, { backgroundColor: currentTheme.background, paddingTop: insets.top }]}
    >
      <SearchScreen
        onSermonPress={onSermonPress}
        onAddToPlaylist={openAddToPlaylist}
        onPlaylistPress={navigateToPlaylist}
        onFirstSermonChange={handleFirstSermonChange}
      />
      {modal}
      {sermonPlaybackModal}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
})
