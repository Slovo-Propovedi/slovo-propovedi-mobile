import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { Keyboard, Pressable, StyleSheet } from 'react-native'
import { isSearchFieldFocusedAtom, searchQueryAtom } from 'features/sermon-search'
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
  onSermonPress,
}: {
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  onFirstSermonChange?: (sermon: SermonData | undefined) => void
  onPlaylistPress: (playlist: PlaylistData) => void
  onSermonPress: (sermon: SermonData) => void
}) => {
  const [query] = useAtom(searchQueryAtom)
  const [isFocused] = useAtom(isSearchFieldFocusedAtom)
  const [isHistoryLoaded] = useAtom(isSearchHistoryLoadedAtom)
  const loadSearchHistory = useAction(loadSearchHistoryAction)
  const [scope, setScope] = useState<SearchScope>('listen')
  const [group, setGroup] = useState<SearchGroup>('sermons')
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const showResults = query.trim().length >= MIN_RESULTS_VIEW_LENGTH
  const paged = usePagedSearch(scope === 'listen' ? query : '')
  const firstSermon = paged.sermons.items[0]
  const { handlePreacherPress, handleRemoveFromSearchHistory, handleSermonPress } =
    useSearchResultActions({ onSermonPress, setGroup })

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

  const handleClearDialogOpenChange = useCallback((open: boolean) => {
    setIsClearDialogOpen(open)
  }, [])

  // The open clear dialog owns the focus, so it holds this pose too.
  if (!isFocused && !isClearDialogOpen && !showResults) return <ScreenTitleRow title='Поиск' />

  return (
    <Pressable style={styles.container} onPress={Keyboard.dismiss}>
      {!showResults && <SearchScopeTabs value={scope} onChange={handleScopeChange} />}
      {showResults ? (
        scope === 'read' ? (
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
        )
      ) : (
        <RecentSearchesSection
          onPress={handleSermonPress}
          onAddToPlaylist={onAddToPlaylist}
          onClearDialogOpenChange={handleClearDialogOpenChange}
        />
      )}
    </Pressable>
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
