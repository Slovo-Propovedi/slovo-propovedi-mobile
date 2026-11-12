import { useAction, useAtom } from '@reatom/npm-react'
import { type ReactElement, useCallback, useEffect, useState } from 'react'
import { Keyboard, Pressable, StyleSheet } from 'react-native'
import {
  isSearchFieldFocusedAtom,
  isSearchQueryActive,
  searchQueryAtom,
} from 'features/sermon-search'
import { type PlaylistData } from 'entities/playlist'
import { isSearchHistoryLoadedAtom, loadSearchHistoryAction } from 'entities/search-history'
import { type AudioPlayerData, type SermonData } from 'entities/sermon'
import { EmptyState, ScreenTitleRow } from 'shared/ui'
import { INDENTS } from 'shared/ui/theme'
import { type SearchGroup } from '../lib/searchGroup'
import { usePagedSearch } from '../lib/usePagedSearch'
import { useSearchResultActions } from '../lib/useSearchResultActions'
import { type PillTabItem, PillTabs } from './PillTabs'
import { RecentSearchesSection } from './RecentSearchesSection'
import { SearchResultsList } from './SearchResultsList'
import { type SearchScope, SearchScopeTabs } from './SearchScopeTabs'
import { wrapFirstSearchRow, wrapSearchGroupHeader, wrapSearchRowMenuButton } from './searchTargets'

const GROUP_ITEMS: PillTabItem[] = [
  { key: 'sermons', label: 'Проповеди' },
  { key: 'playlists', label: 'Плейлисты' },
  { key: 'preachers', label: 'Проповедники' },
]

const READ_PLACEHOLDER = 'Раздел «Читать» скоро появится'

const toSearchGroup = (key: string): SearchGroup => {
  if (key === 'playlists') return 'playlists'
  if (key === 'preachers') return 'preachers'

  return 'sermons'
}

const wrapGroupPill = (item: PillTabItem, pill: ReactElement) =>
  item.key === 'sermons' ? wrapSearchGroupHeader(pill) : pill

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
  const isActive = isSearchQueryActive(query)
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

  if (!isFocused && !isActive) return <ScreenTitleRow title='Поиск' />

  return (
    <Pressable style={styles.container} onPress={Keyboard.dismiss}>
      <SearchScopeTabs value={scope} onChange={handleScopeChange} />
      {isActive ? (
        scope === 'read' ? (
          <EmptyState message={READ_PLACEHOLDER} />
        ) : (
          <>
            <PillTabs
              value={group}
              items={GROUP_ITEMS}
              wrapItem={wrapGroupPill}
              onChange={handleGroupChange}
            />
            <SearchResultsList
              group={group}
              paged={paged}
              onSermonPress={handleSermonPress}
              onPlaylistPress={onPlaylistPress}
              onAddToPlaylist={onAddToPlaylist}
              wrapFirstRow={wrapFirstSearchRow}
              onPreacherPress={handlePreacherPress}
              wrapMenuButton={wrapSearchRowMenuButton}
              onRemoveFromSearchHistory={handleRemoveFromSearchHistory}
            />
          </>
        )
      ) : (
        <RecentSearchesSection onPress={handleSermonPress} onAddToPlaylist={onAddToPlaylist} />
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
