import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { searchQueryAtom } from 'features/sermon-search'
import { type PlaylistData } from 'entities/playlist'
import { isSearchHistoryLoadedAtom, loadSearchHistoryAction } from 'entities/search-history'
import { type AudioPlayerData, type SermonData } from 'entities/sermon'
import { EmptyState, ScreenTitleRow } from 'shared/ui'
import { INDENTS } from 'shared/ui/theme'
import { type SearchGroup } from '../lib/searchGroup'
import { MIN_RESULTS_VIEW_LENGTH } from '../lib/searchThresholds'
import { usePagedSearch } from '../lib/usePagedSearch'
import { useSearchResultActions } from '../lib/useSearchResultActions'
import { RecentSearchesSection } from './RecentSearchesSection'
import { SearchResultsView } from './SearchResultsView'
import { type SearchScope, SearchScopeTabs } from './SearchScopeTabs'

const READ_PLACEHOLDER = 'Раздел «Читать» скоро появится'

const toSearchGroup = (key: string): SearchGroup => {
  if (key === 'playlists') return 'playlists'
  if (key === 'preachers') return 'preachers'

  return 'sermons'
}

export const SearchScreen = ({
  onAddToPlaylist,
  onFirstSermonChange,
  onPlaylistPress,
  onPreacherPress,
  onSermonPress,
}: {
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  onFirstSermonChange?: (sermon: SermonData | undefined) => void
  onPlaylistPress: (playlist: PlaylistData) => void
  onPreacherPress: (artist: string) => void
  onSermonPress: (sermon: SermonData) => void
}) => {
  const [query] = useAtom(searchQueryAtom)
  const [isHistoryLoaded] = useAtom(isSearchHistoryLoadedAtom)
  const loadSearchHistory = useAction(loadSearchHistoryAction)
  const [scope, setScope] = useState<SearchScope>('listen')
  const [group, setGroup] = useState<SearchGroup>('sermons')
  const showResults = query.trim().length >= MIN_RESULTS_VIEW_LENGTH
  const paged = usePagedSearch(scope === 'listen' ? query : '')
  const firstSermon = paged.sermons.items[0]
  const { handlePreacherPress, handleRemoveFromSearchHistory, handleSermonPress } =
    useSearchResultActions({ onPreacherPress, onSermonPress })

  useEffect(() => {
    if (!isHistoryLoaded) void loadSearchHistory()
  }, [isHistoryLoaded, loadSearchHistory])

  useEffect(() => {
    onFirstSermonChange?.(firstSermon)
  }, [firstSermon, onFirstSermonChange])

  const handleScopeChange = useCallback((key: string) => {
    setScope(key === 'read' ? 'read' : 'listen')
  }, [])

  const handleGroupChange = useCallback((key: string) => {
    setGroup(toSearchGroup(key))
  }, [])

  // Ruling: the results pose has no «Поиск» title — the group select takes its
  // place, and only the results list changes with focus.
  if (showResults)
    return (
      <View style={styles.container}>
        {scope === 'read' ? (
          <EmptyState message={READ_PLACEHOLDER} />
        ) : (
          <SearchResultsView
            group={group}
            paged={paged}
            query={query}
            onChangeGroup={handleGroupChange}
            onSermonPress={handleSermonPress}
            onPlaylistPress={onPlaylistPress}
            onAddToPlaylist={onAddToPlaylist}
            onPreacherPress={handlePreacherPress}
            onRemoveFromSearchHistory={handleRemoveFromSearchHistory}
          />
        )}
      </View>
    )

  // One main page for every short query, focused or not: title, scope select
  // and recents never unmount on focus changes.
  return (
    <View style={styles.container}>
      <ScreenTitleRow title='Поиск' />
      <SearchScopeTabs value={scope} onChange={handleScopeChange} />
      {scope === 'read' ? (
        <EmptyState message={READ_PLACEHOLDER} />
      ) : (
        <RecentSearchesSection onPress={handleSermonPress} onAddToPlaylist={onAddToPlaylist} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Small breathing room below the top safe-area inset, which the screen
    // wrapper already applies.
    paddingTop: INDENTS.low,
  },
})
