import { useAtom } from '@reatom/npm-react'
import { usePathname } from 'expo-router'
import { useCallback, useRef } from 'react'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { useTourActionRegistrar } from 'features/onboarding'
import { useSearchUrlSync, useSermonPlayback } from 'features/sermon-search'
import { type SermonData } from 'entities/sermon'
import { BLUR_TARGET_ROUTES, BlurBackdrop } from 'shared/ui'
import { useInsetsPadding, useScreenChromePadding } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { useClearSearchOnLeave } from '../lib/useClearSearchOnLeave'
import { useSearchNavigation } from '../lib/useSearchNavigation'
import { useSearchTourActions } from '../lib/useSearchTourActions'
import { searchSessionNonceAtom } from '../model/searchSession'
import { SearchScreen } from './SearchScreen'
import { wrapSearchPicker } from './searchTargets'

const CLOSE_SERMON_PICKER_ACTION_ID = 'close-sermon-playlist-picker'

/**
 * The search route root. It syncs the router pathname into the search-session
 * state (`useClearSearchOnLeave`): the `/search` route reveals the field pill,
 * leaving it resets the session in one transaction. The `key` remounts
 * SearchScreen after every reset, so scope, group and loaded pages come back
 * exactly as on a first visit.
 */
export const SearchTabScreen = () => {
  const insets = useSafeAreaInsets()
  const { topChromeHeight } = useScreenChromePadding()
  // The resolved top edge: the field pill needs the higher of the safe area and
  // the wide island band, and the glide must follow the resolved value.
  const insetsPadding = useInsetsPadding({
    left: insets.left,
    right: insets.right,
    top: Math.max(insets.top, topChromeHeight),
  })
  const { currentTheme } = useTheme()
  const pathname = usePathname()
  useClearSearchOnLeave(pathname)
  useSearchUrlSync()
  const [sessionNonce] = useAtom(searchSessionNonceAtom)
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
  useSearchTourActions({ getFirstSermon, onPressFirstSermon: onSermonPress })
  useTourActionRegistrar(CLOSE_SERMON_PICKER_ACTION_ID, closePicker)

  return (
    <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.search}>
      <Animated.View
        style={[styles.safeArea, { backgroundColor: currentTheme.background }, insetsPadding]}
      >
        <SearchScreen
          key={sessionNonce}
          onSermonPress={onSermonPress}
          onAddToPlaylist={openAddToPlaylist}
          onPlaylistPress={navigateToPlaylist}
          onPreacherPress={navigateToPreacher}
          onFirstSermonChange={handleFirstSermonChange}
        />
      </Animated.View>
      {modal}
      {sermonPlaybackModal}
    </BlurBackdrop>
  )
}

const styles = {
  safeArea: {
    flex: 1,
  },
}
