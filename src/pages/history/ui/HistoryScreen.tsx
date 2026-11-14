import { useAtom } from '@reatom/npm-react'
import { useNavigation } from 'expo-router'
import { useCallback, useLayoutEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { OnboardingHelpRow, OnboardingTarget, useTourScrollable } from 'features/onboarding'
import { usePlaybackChoice } from 'features/playback-choice'
import { useIsBarCollapseSuspended } from 'features/sermon-search/@x/suspension'
import {
  getEntrySermon,
  historyAtom,
  isHistoryLoadedAtom,
  type ListeningHistoryEntry,
} from 'entities/listening-history'
import { currentAudioAtom, isPlayingAtom } from 'entities/player'
import { createTracksListStyles, TracksListSkeleton } from 'entities/track-list'
import { tabBarHeightAtom, useBarCollapseOnScroll } from 'shared/ui/layout'
import { INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { resolveEntryFallbackPlaylist } from '../lib/resolveEntryFallbackPlaylist'
import { HistoryEmptyState } from './HistoryEmptyState'
import { HistoryHeaderMenu } from './HistoryHeaderMenu'
import { HistoryRow } from './HistoryRow'
import { HistorySeparator } from './HistorySeparator'

const PLAYBACK_ERROR_MESSAGE = 'Не удалось воспроизвести проповедь из истории'
const PLAYBACK_ORIGIN_LABEL = 'Плейлист, в котором было прослушано'

const styles = StyleSheet.create({
  skeletonList: {
    paddingTop: INDENTS.low,
  },
  skeletonRow: {
    marginHorizontal: INDENTS.medium,
  },
})

export const HistoryScreen = () => {
  const { currentTheme } = useTheme()
  const navigation = useNavigation()
  const [entries] = useAtom(historyAtom)
  const [isHistoryLoaded] = useAtom(isHistoryLoadedAtom)
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const isBarCollapseSuspended = useIsBarCollapseSuspended()
  const { onScroll } = useBarCollapseOnScroll({
    isSuspended: isBarCollapseSuspended,
  })
  const tracksListStyles = createTracksListStyles(currentTheme)
  const { modal, openAddToPlaylist } = useAddToPlaylistModal()
  const { dialog, openChoice } = usePlaybackChoice({
    errorMessage: PLAYBACK_ERROR_MESSAGE,
    getFallbackPlaylist: resolveEntryFallbackPlaylist,
    originLabel: PLAYBACK_ORIGIN_LABEL,
  })
  const tourScrollableRef = useTourScrollable()

  const handlePress = useCallback(
    async (entry: ListeningHistoryEntry) => {
      const sermon = getEntrySermon(entry)
      if (!sermon) return
      // Resolve the playlist first; a rejected resolve (storage read) degrades to the snapshot.
      const playlistLookup = resolveEntryFallbackPlaylist(sermon, entry.playlist)
      const resolved = await playlistLookup.catch(() => undefined)
      openChoice(sermon, resolved ?? entry.playlist)
    },
    [openChoice],
  )

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <OnboardingHelpRow>
          <OnboardingTarget id='history.header-menu'>
            <HistoryHeaderMenu />
          </OnboardingTarget>
        </OnboardingHelpRow>
      ),
    })
    return () => navigation.setOptions({ headerRight: undefined })
  }, [navigation])

  if (!isHistoryLoaded && entries.length === 0)
    return (
      <View style={tracksListStyles.container}>
        <View style={styles.skeletonList}>
          <TracksListSkeleton rowStyle={styles.skeletonRow} />
        </View>
      </View>
    )

  return (
    <View style={tracksListStyles.container}>
      <OnboardingTarget id='history.rows' style={{ flex: 1 }}>
        <Animated.FlatList
          data={entries}
          onScroll={onScroll}
          ref={tourScrollableRef}
          scrollEventThrottle={16}
          ItemSeparatorComponent={HistorySeparator}
          ListEmptyComponent={<HistoryEmptyState />}
          keyExtractor={item => getEntrySermon(item)?.id ?? `${item.lastPlayedAt}`}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: entries.length === 0 ? 'center' : undefined,
            paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
          }}
          renderItem={({ item }) => {
            const sermonId = getEntrySermon(item)?.id
            const isCurrentAudio = sermonId !== undefined && currentAudio?.id === sermonId
            return (
              <HistoryRow
                entry={item}
                onPress={handlePress}
                isPlaying={isCurrentAudio}
                onAddToPlaylist={openAddToPlaylist}
                isAudioPlaying={isCurrentAudio && isPlaying}
              />
            )
          }}
        />
      </OnboardingTarget>
      {dialog}
      {modal}
    </View>
  )
}
