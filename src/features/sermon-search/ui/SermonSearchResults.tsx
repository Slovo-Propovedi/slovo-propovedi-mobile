import { useAtom } from '@reatom/npm-react'
import { useCallback } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native'
import { useHistoryProgressMap } from 'entities/listening-history'
import { usePlayNewSermon } from 'entities/player'
import { EmptyState } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import type { ColorValue } from 'react-native'
import type { SermonData } from 'shared/model'
import { resolvePlaylist } from '../lib/resolvePlaylist'
import { useDebouncedSearch } from '../lib/useDebouncedSearch'
import { isSearchingAtom, MIN_QUERY_LENGTH, searchQueryAtom, searchResultsAtom } from '../model'
import { SearchResultsRow } from './SearchResultsRow'
import { SearchRowSeparator } from './SearchRowSeparator'

const NO_RESULTS_MESSAGE = 'Ничего не найдено'

export const SermonSearchResults = () => {
  useDebouncedSearch()

  const { currentTheme } = useTheme()
  const [query] = useAtom(searchQueryAtom)
  const [results] = useAtom(searchResultsAtom)
  const [isSearching] = useAtom(isSearchingAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const playNewSermon = usePlayNewSermon()
  const progressMap = useHistoryProgressMap()

  const handlePress = useCallback(
    (sermon: SermonData) => void playNewSermon({ playlist: resolvePlaylist(sermon), sermon }),
    [playNewSermon],
  )

  if (query.trim().length < MIN_QUERY_LENGTH) return null

  return (
    <FlatList
      keyboardDismissMode='on-drag'
      keyExtractor={({ id }) => id}
      data={isSearching ? [] : results}
      keyboardShouldPersistTaps='handled'
      ItemSeparatorComponent={SearchRowSeparator}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight },
      ]}
      renderItem={({ item }) => (
        <SearchResultsRow
          sermon={item}
          onPress={handlePress}
          storedProgress={progressMap.get(item.id)}
        />
      )}
      ListEmptyComponent={
        isSearching ? (
          <SearchSpinner color={currentTheme.primary} />
        ) : (
          <EmptyState message={NO_RESULTS_MESSAGE} />
        )
      }
    />
  )
}

const SearchSpinner = ({ color }: { color: ColorValue }) => (
  <View style={styles.spinnerContainer}>
    <ActivityIndicator size='large' color={color} />
  </View>
)

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  spinnerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
})
