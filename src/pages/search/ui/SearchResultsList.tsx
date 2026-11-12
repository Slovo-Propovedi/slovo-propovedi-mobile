import { useAtom } from '@reatom/npm-react'
import { type ReactElement } from 'react'
import { ActivityIndicator } from 'react-native'
import Animated from 'react-native-reanimated'
import {
  SearchPlaylistRow,
  SearchPreacherRow,
  SearchResultsRow,
  SearchRowSeparator,
} from 'features/sermon-search'
import { useIsBarCollapseSuspended } from 'features/sermon-search/@x/suspension'
import { useHistoryProgressMap, useHistorySermonIds } from 'entities/listening-history'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData, type SermonData } from 'entities/sermon'
import { EmptyState } from 'shared/ui'
import { tabBarHeightAtom, useBarCollapseOnScroll } from 'shared/ui/layout'
import { INDENTS, PLAYER_SIZES } from 'shared/ui/theme'
import { type PagedSearch } from '../lib/pagedGroup'
import { type SearchGroup } from '../lib/searchGroup'
import { MIN_RESULTS_VIEW_LENGTH } from '../lib/searchThresholds'
import { SearchResultsSkeleton } from './SearchResultsSkeleton'

const NO_RESULTS_MESSAGE = 'Ничего не найдено'
const FOOTER_STYLE = { paddingVertical: INDENTS.medium }

export const SearchResultsList = ({
  group,
  onAddToPlaylist,
  onPlaylistPress,
  onPreacherPress,
  onRemoveFromSearchHistory,
  onSermonPress,
  paged,
  query,
  wrapFirstRow,
  wrapMenuButton,
}: {
  group: SearchGroup
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  onPlaylistPress: (playlist: PlaylistData) => void
  onPreacherPress: (artist: string) => void
  onRemoveFromSearchHistory: (sermonId: string) => void
  onSermonPress: (sermon: SermonData) => void
  paged: PagedSearch
  query: string
  wrapFirstRow?: (row: ReactElement) => ReactElement
  wrapMenuButton?: (button: ReactElement) => ReactElement
}) => {
  const progressMap = useHistoryProgressMap()
  const historySermonIds = useHistorySermonIds()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const isBarCollapseSuspended = useIsBarCollapseSuspended()
  const { onScroll } = useBarCollapseOnScroll({ isSuspended: isBarCollapseSuspended })
  const showEmptyState = query.trim().length >= MIN_RESULTS_VIEW_LENGTH

  const groupState =
    group === 'sermons' ? paged.sermons : group === 'playlists' ? paged.playlists : paged.preachers

  const listProps = {
    contentContainerStyle: [
      { flexGrow: 1 },
      { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight },
    ],
    ItemSeparatorComponent: SearchRowSeparator,
    keyboardShouldPersistTaps: 'handled' as const,
    ListEmptyComponent: groupState.isLoading ? (
      <SearchResultsSkeleton />
    ) : showEmptyState ? (
      <EmptyState message={NO_RESULTS_MESSAGE} />
    ) : undefined,
    ListFooterComponent: groupState.isLoadingMore ? (
      <ActivityIndicator style={FOOTER_STYLE} />
    ) : undefined,
    onEndReached: () => {
      if (groupState.hasMore && !groupState.isLoadingMore) groupState.loadMore()
    },
    onEndReachedThreshold: 0.4,
    onScroll,
    scrollEventThrottle: 16,
  }

  if (group === 'playlists')
    return (
      <Animated.FlatList
        {...listProps}
        data={paged.playlists.items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <SearchPlaylistRow playlist={item} onPress={onPlaylistPress} />}
      />
    )

  if (group === 'preachers')
    return (
      <Animated.FlatList
        {...listProps}
        data={paged.preachers.items}
        keyExtractor={artist => artist}
        renderItem={({ item }) => <SearchPreacherRow artist={item} onPress={onPreacherPress} />}
      />
    )

  const renderSermon = ({ index, item }: { index: number; item: SermonData }) => {
    const row = (
      <SearchResultsRow
        sermon={item}
        onPress={onSermonPress}
        onAddToPlaylist={onAddToPlaylist}
        progress={progressMap.get(item.id)}
        inHistory={historySermonIds.has(item.id)}
        menuButtonWrapper={index === 0 ? wrapMenuButton : undefined}
        onRemoveFromSearchHistory={() => onRemoveFromSearchHistory(item.id)}
      />
    )

    return index === 0 && wrapFirstRow ? wrapFirstRow(row) : row
  }

  return (
    <Animated.FlatList
      {...listProps}
      renderItem={renderSermon}
      data={paged.sermons.items}
      keyExtractor={item => item.id}
    />
  )
}
