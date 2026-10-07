import { useAtom } from '@reatom/npm-react'
import { FlatList, type ListRenderItem, StyleSheet } from 'react-native'
import { EmptyState } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { ResultsListSeparator } from './ResultsListSeparator'

const NO_RESULTS_MESSAGE = 'Ничего не найдено'

export const ResultsList = <T,>({
  data,
  keyExtractor,
  renderItem,
}: {
  data: T[]
  keyExtractor: (item: T) => string
  renderItem: ListRenderItem<T>
}) => {
  const [tabBarHeight] = useAtom(tabBarHeightAtom)

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      keyboardDismissMode='on-drag'
      keyboardShouldPersistTaps='handled'
      ItemSeparatorComponent={ResultsListSeparator}
      ListEmptyComponent={<EmptyState message={NO_RESULTS_MESSAGE} />}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: 12,
  },
})
