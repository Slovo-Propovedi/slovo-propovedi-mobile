import { type ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData, type SermonData } from 'entities/sermon'
import { INDENTS } from 'shared/ui/theme'
import { type PagedSearch } from '../lib/pagedGroup'
import { type SearchGroup } from '../lib/searchGroup'
import { type PillTabItem, PillTabs } from './PillTabs'
import { SearchResultsList } from './SearchResultsList'
import { wrapFirstSearchRow, wrapSearchGroupHeader, wrapSearchRowMenuButton } from './searchTargets'

const GROUP_ITEMS: PillTabItem[] = [
  { key: 'sermons', label: 'Проповеди' },
  { key: 'playlists', label: 'Плейлисты' },
  { key: 'preachers', label: 'Проповедники' },
]

const wrapGroupPill = (item: PillTabItem, pill: ReactElement) =>
  item.key === 'sermons' ? wrapSearchGroupHeader(pill) : pill

// The results pose: the group select is the only top row, followed by the
// paginated list of the selected group.
export const SearchResultsView = ({
  group,
  onAddToPlaylist,
  onChangeGroup,
  onPlaylistPress,
  onPreacherPress,
  onRemoveFromSearchHistory,
  onSermonPress,
  paged,
  query,
}: {
  group: SearchGroup
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  onChangeGroup: (key: string) => void
  onPlaylistPress: (playlist: PlaylistData) => void
  onPreacherPress: (artist: string) => void
  onRemoveFromSearchHistory: (sermonId: string) => void
  onSermonPress: (sermon: SermonData) => void
  paged: PagedSearch
  query: string
}) => (
  <>
    <View style={styles.groupTabs} testID='search-group-tabs'>
      <PillTabs
        value={group}
        variant='results'
        items={GROUP_ITEMS}
        wrapItem={wrapGroupPill}
        onChange={onChangeGroup}
      />
    </View>
    <SearchResultsList
      group={group}
      paged={paged}
      query={query}
      onSermonPress={onSermonPress}
      onPlaylistPress={onPlaylistPress}
      onAddToPlaylist={onAddToPlaylist}
      wrapFirstRow={wrapFirstSearchRow}
      onPreacherPress={onPreacherPress}
      wrapMenuButton={wrapSearchRowMenuButton}
      onRemoveFromSearchHistory={onRemoveFromSearchHistory}
    />
  </>
)

const styles = StyleSheet.create({
  // Extra gap under the results select, the only top row while a query is active.
  groupTabs: { marginBottom: INDENTS.medium },
})
