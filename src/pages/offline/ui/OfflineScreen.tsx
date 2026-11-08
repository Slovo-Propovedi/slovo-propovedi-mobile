import { useAtom } from '@reatom/npm-react'
import { useNavigation } from 'expo-router'
import { useCallback, useLayoutEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { type OfflineSermonItem, useOfflineSermons } from 'features/offline-sermons'
import { OnboardingTarget, useTourScrollable } from 'features/onboarding'
import { usePlaybackChoice } from 'features/playback-choice'
import { useIsSearchBarCollapseSuspended } from 'features/sermon-search/@x/suspension'
import { sermonCachingEnabledAtom } from 'entities/offline-cache'
import { isPlayingAtom } from 'entities/player'
import { isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { createTracksListStyles, TracksListSkeleton } from 'entities/track-list'
import { tabBarHeightAtom, useBarCollapseOnScroll } from 'shared/ui/layout'
import { INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { buildOfflinePlaylist } from '../lib/offlinePlaylist'
import { OFFLINE_PLAYBACK_ERROR_MESSAGE, usePlayAllOffline } from '../lib/usePlayAllOffline'
import { OfflineEmptyState } from './OfflineEmptyState'
import { OfflineHeaderActions } from './OfflineHeaderActions'
import { OfflineRow } from './OfflineRow'
import { OfflineSeparator } from './OfflineSeparator'

// Cap rows mounted on first paint and per batch: each row runs its own
// subscriptions and a native file check, so a large window lands in one wave.
const INITIAL_ROWS_TO_RENDER = 8
const ROWS_PER_BATCH = 8
const LIST_WINDOW_SIZE = 7
const OFFLINE_LIST_LABEL = 'Плейлист всех скачанных проповедей'
const OFFLINE_ORIGIN_LABEL = 'Плейлист, из которого добавлено в офлайн'

const styles = StyleSheet.create({
  skeletonList: {
    paddingTop: INDENTS.low,
  },
  skeletonRow: {
    marginHorizontal: INDENTS.medium,
  },
})

export const OfflineScreen = () => {
  const { currentTheme } = useTheme()
  const navigation = useNavigation()
  const { isLoading, items } = useOfflineSermons()
  const [isPlaying] = useAtom(isPlayingAtom)
  const [isPlayerExpanded] = useAtom(isPlayerExpandedAtom)
  const [isCachingEnabled] = useAtom(sermonCachingEnabledAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const isSearchBarCollapseSuspended = useIsSearchBarCollapseSuspended()
  const { onScroll } = useBarCollapseOnScroll({
    isSuspended: isPlayerExpanded || isSearchBarCollapseSuspended,
  })
  const tracksListStyles = createTracksListStyles(currentTheme)
  const { modal, openAddToPlaylist } = useAddToPlaylistModal()
  const getOfflinePlaylist = useCallback(() => buildOfflinePlaylist(items), [items])
  const playAll = usePlayAllOffline(items)
  const isPlayAllDisabled = items.length === 0
  const { dialog, openChoice } = usePlaybackChoice({
    errorMessage: OFFLINE_PLAYBACK_ERROR_MESSAGE,
    getFallbackPlaylist: getOfflinePlaylist,
    getOfflinePlaylist,
    offlineLabel: OFFLINE_LIST_LABEL,
    originLabel: OFFLINE_ORIGIN_LABEL,
  })
  const tourScrollableRef = useTourScrollable()

  const handlePlayPress = useCallback(
    (item: OfflineSermonItem) => openChoice(item.sermon, item.playlist),
    [openChoice],
  )

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <OfflineHeaderActions onPlayAll={playAll} isPlayAllDisabled={isPlayAllDisabled} />
      ),
    })
    return () => {
      navigation.setOptions({ headerRight: undefined })
    }
  }, [isPlayAllDisabled, navigation, playAll])

  if (isLoading && items.length === 0)
    return (
      <View style={tracksListStyles.container}>
        <View style={styles.skeletonList}>
          <TracksListSkeleton rowStyle={styles.skeletonRow} />
        </View>
      </View>
    )

  return (
    <View style={tracksListStyles.container}>
      <OnboardingTarget id='offline.rows' style={{ flex: 1 }}>
        <Animated.FlatList
          data={items}
          onScroll={onScroll}
          ref={tourScrollableRef}
          scrollEventThrottle={16}
          windowSize={LIST_WINDOW_SIZE}
          maxToRenderPerBatch={ROWS_PER_BATCH}
          keyExtractor={item => item.sermon.id}
          ItemSeparatorComponent={OfflineSeparator}
          initialNumToRender={INITIAL_ROWS_TO_RENDER}
          ListEmptyComponent={<OfflineEmptyState isCachingEnabled={isCachingEnabled} />}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: items.length === 0 ? 'center' : undefined,
            paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
          }}
          renderItem={({ item }) => (
            <OfflineRow
              item={item}
              isPlaying={isPlaying}
              onPress={handlePlayPress}
              onAddToPlaylist={openAddToPlaylist}
            />
          )}
        />
      </OnboardingTarget>
      {dialog}
      {modal}
    </View>
  )
}
