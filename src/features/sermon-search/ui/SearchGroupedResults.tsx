import { useAtom } from '@reatom/npm-react'
import { useCallback } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { useHistoryProgressMap, useHistorySermonIds } from 'entities/listening-history'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { EmptyState } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { useDebouncedSearch } from '../lib/useDebouncedSearch'
import { useSermonPlayback } from '../lib/useSermonPlayback'
import {
  isSearchingAtom,
  MIN_QUERY_LENGTH,
  searchPlaylistsAtom,
  searchPreachersAtom,
  searchQueryAtom,
  searchResultsAtom,
} from '../model'
import { SearchGroupedResultsSkeleton } from './SearchGroupedResultsSkeleton'
import { SearchGroupSkeleton } from './SearchGroupSkeleton'
import { SearchPlaylistGroup } from './SearchPlaylistGroup'
import { SearchPreacherGroup } from './SearchPreacherGroup'
import { SearchSermonGroup } from './SearchSermonGroup'

const NO_RESULTS_MESSAGE = 'Ничего не найдено'

type SearchGroupKey = 'playlists' | 'preachers' | 'sermons'

export const SearchGroupedResults = ({
  onAddToPlaylist,
  onPlaylistPress,
  onPreacherPress,
  onShowAllGroup,
}: {
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  onPlaylistPress: (playlist: PlaylistData) => void
  onPreacherPress?: (artist: string) => void
  onShowAllGroup?: (group: SearchGroupKey, query: string) => void
}) => {
  useDebouncedSearch()

  const { currentTheme } = useTheme()
  const [query] = useAtom(searchQueryAtom)
  const [sermons] = useAtom(searchResultsAtom)
  const [playlists] = useAtom(searchPlaylistsAtom)
  const [preachers] = useAtom(searchPreachersAtom)
  const [isSearching] = useAtom(isSearchingAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { modal, onSermonPress } = useSermonPlayback()
  const progressMap = useHistoryProgressMap()
  const historySermonIds = useHistorySermonIds()

  const trimmedQuery = query.trim()

  const handlePreacherPress = useCallback(
    (artist: string) => onPreacherPress?.(artist),
    [onPreacherPress],
  )

  const handleShowAllGroup = useCallback(
    (group: SearchGroupKey) => () => onShowAllGroup?.(group, trimmedQuery),
    [onShowAllGroup, trimmedQuery],
  )

  if (trimmedQuery.length < MIN_QUERY_LENGTH) return null

  const isEmpty = sermons.length === 0 && playlists.length === 0 && preachers.length === 0

  return (
    <>
      <ScrollView
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='handled'
        style={[styles.scroll, { backgroundColor: currentTheme.background }]}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight },
        ]}
      >
        {isSearching ? (
          <SearchGroupedResults.Skeleton />
        ) : isEmpty ? (
          <EmptyState message={NO_RESULTS_MESSAGE} />
        ) : (
          <>
            <SearchSermonGroup
              sermons={sermons}
              onPress={onSermonPress}
              progressMap={progressMap}
              onAddToPlaylist={onAddToPlaylist}
              historySermonIds={historySermonIds}
              onShowAll={handleShowAllGroup('sermons')}
            />
            <SearchPlaylistGroup
              playlists={playlists}
              onPress={onPlaylistPress}
              onShowAll={handleShowAllGroup('playlists')}
            />
            <SearchPreacherGroup
              preachers={preachers}
              onPress={handlePreacherPress}
              onShowAll={handleShowAllGroup('preachers')}
            />
          </>
        )}
      </ScrollView>
      {modal}
    </>
  )
}

// Skeletons hang off the public component (Composition API).
SearchGroupedResults.Skeleton = SearchGroupedResultsSkeleton
SearchGroupedResults.GroupSkeleton = SearchGroupSkeleton

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  scroll: {
    flex: 1,
  },
})
