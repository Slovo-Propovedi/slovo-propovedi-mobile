import { useAtom } from '@reatom/npm-react'
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native'
import { usePlayNewSermon } from 'entities/player'
import { EmptyState } from 'shared/ui'
import { INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/themed'
import type { ColorValue } from 'react-native'
import { resolvePlaylist } from '../lib/resolvePlaylist'
import { useDebouncedSearch } from '../lib/useDebouncedSearch'
import { isSearchingAtom, MIN_QUERY_LENGTH, searchQueryAtom, searchResultsAtom } from '../model'
import { SermonSearchRow } from './SermonSearchRow'

const NO_RESULTS_MESSAGE = 'Ничего не найдено'

export const SermonSearchResults = () => {
  useDebouncedSearch()

  const { currentTheme } = useTheme()
  const [query] = useAtom(searchQueryAtom)
  const [results] = useAtom(searchResultsAtom)
  const [isSearching] = useAtom(isSearchingAtom)
  const playNewSermon = usePlayNewSermon()

  if (query.trim().length < MIN_QUERY_LENGTH) return null

  return (
    <FlatList
      keyboardDismissMode='on-drag'
      keyExtractor={({ id }) => id}
      data={isSearching ? [] : results}
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={SearchRowSeparator}
      ListEmptyComponent={
        isSearching ? (
          <SearchSpinner color={currentTheme.primary} />
        ) : (
          <EmptyState message={NO_RESULTS_MESSAGE} />
        )
      }
      renderItem={({ item }) => (
        <SermonSearchRow
          sermon={item}
          onPress={() => void playNewSermon({ playlist: resolvePlaylist(item), sermon: item })}
        />
      )}
    />
  )
}

const SearchSpinner = ({ color }: { color: ColorValue }) => (
  <View style={styles.spinnerContainer}>
    <ActivityIndicator size='large' color={color} />
  </View>
)

const SearchRowSeparator = () => {
  const { currentTheme } = useTheme()

  return <View style={[styles.separator, { backgroundColor: currentTheme.surface }]} />
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingBottom: PLAYER_SIZES.tabBarHeight + PLAYER_SIZES.miniPlayerHeight,
  },
  separator: {
    height: 1,
    marginLeft: 48 + INDENTS.middle + INDENTS.medium,
    marginRight: INDENTS.medium,
  },
  spinnerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
})
