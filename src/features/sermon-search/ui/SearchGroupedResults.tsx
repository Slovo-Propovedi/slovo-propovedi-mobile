import { useAtom } from '@reatom/npm-react'
import { type ReactElement, type ReactNode, useCallback } from 'react'
import { useHistoryProgressMap, useHistorySermonIds } from 'entities/listening-history'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { EmptyState } from 'shared/ui'
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
import { SearchResultsScroll } from './SearchResultsScroll'
import { SearchSermonGroup } from './SearchSermonGroup'

const NO_RESULTS_MESSAGE = 'Ничего не найдено'

type SearchGroupKey = 'playlists' | 'preachers' | 'sermons'

export const SearchGroupedResults = ({
  firstRowMenuButtonWrapper,
  firstRowWrapper,
  groupHeaderWrapper,
  onAddToPlaylist,
  onPlaylistPress,
  onPreacherPress,
  onShowAllGroup,
  pickerWrapper,
}: {
  // Page-owned wrappers (dependency inversion): this feature never imports onboarding.
  firstRowMenuButtonWrapper?: (button: ReactElement) => ReactElement
  firstRowWrapper?: (row: ReactElement) => ReactNode
  groupHeaderWrapper?: (header: ReactElement) => ReactNode
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  onPlaylistPress: (playlist: PlaylistData) => void
  onPreacherPress?: (artist: string) => void
  onShowAllGroup?: (group: SearchGroupKey, query: string) => void
  pickerWrapper?: (dialog: ReactElement) => ReactNode
}) => {
  useDebouncedSearch()

  const [query] = useAtom(searchQueryAtom)
  const [sermons] = useAtom(searchResultsAtom)
  const [playlists] = useAtom(searchPlaylistsAtom)
  const [preachers] = useAtom(searchPreachersAtom)
  const [isSearching] = useAtom(isSearchingAtom)
  const { modal, onSermonPress } = useSermonPlayback({ pickerWrapper })
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
      <SearchResultsScroll>
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
              firstRowWrapper={firstRowWrapper}
              historySermonIds={historySermonIds}
              groupHeaderWrapper={groupHeaderWrapper}
              onShowAll={handleShowAllGroup('sermons')}
              firstRowMenuButtonWrapper={firstRowMenuButtonWrapper}
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
      </SearchResultsScroll>
      {modal}
    </>
  )
}

// Skeletons hang off the public component (Composition API).
SearchGroupedResults.Skeleton = SearchGroupedResultsSkeleton
SearchGroupedResults.GroupSkeleton = SearchGroupSkeleton
