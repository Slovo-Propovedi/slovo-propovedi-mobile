import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { searchQueryAtom } from 'features/sermon-search'
import { type PlaylistData } from 'entities/playlist'
import { isSearchHistoryLoadedAtom, loadSearchHistoryAction } from 'entities/search-history'
import { type AudioPlayerData, type SermonData } from 'entities/sermon'
import { EmptyState } from 'shared/ui'
import { INDENTS } from 'shared/ui/theme'
import { type SearchGroup } from '../lib/searchGroup'
import { MIN_RESULTS_VIEW_LENGTH } from '../lib/searchThresholds'
import { usePagedSearch } from '../lib/usePagedSearch'
import { useResultsTransition } from '../lib/useResultsTransition'
import { useSearchResultActions } from '../lib/useSearchResultActions'
import { RecentSearchesSection } from './RecentSearchesSection'
import { SearchChrome } from './SearchChrome'
import { SearchPageField } from './SearchPageField'
import { SearchResultsView } from './SearchResultsView'
import { type SearchScope } from './SearchScopeTabs'

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

  const { categoriesStyle, isResultsSettled, scopeStyle, titleStyle } =
    useResultsTransition(showResults)

  // Ruling: the results pose has no «Поиск» title — the group select takes its
  // place. The field keeps one flow slot in both poses, so the chrome above it
  // folds away (and the category pills unfold below it) instead of jumping.
  const content = showResults ? (
    scope === 'read' ? (
      <EmptyState message={READ_PLACEHOLDER} />
    ) : (
      <SearchResultsView
        group={group}
        paged={paged}
        query={query}
        tabsStyle={categoriesStyle}
        onChangeGroup={handleGroupChange}
        onSermonPress={handleSermonPress}
        onPlaylistPress={onPlaylistPress}
        onAddToPlaylist={onAddToPlaylist}
        onPreacherPress={handlePreacherPress}
        onRemoveFromSearchHistory={handleRemoveFromSearchHistory}
      />
    )
  ) : scope === 'read' ? (
    <EmptyState message={READ_PLACEHOLDER} />
  ) : (
    <RecentSearchesSection onPress={handleSermonPress} onAddToPlaylist={onAddToPlaylist} />
  )

  return (
    <View style={styles.container}>
      <SearchChrome
        scope={scope}
        scopeStyle={scopeStyle}
        titleStyle={titleStyle}
        onChange={handleScopeChange}
        isHidden={showResults && isResultsSettled}
        isScopeClipped={showResults || isResultsSettled}
      />
      <SearchPageField />
      {content}
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
