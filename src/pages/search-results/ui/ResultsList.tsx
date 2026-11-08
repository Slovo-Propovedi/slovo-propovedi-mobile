import { useAtom } from '@reatom/npm-react'
import { type ListRenderItem, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { useIsSearchBarCollapseSuspended } from 'features/sermon-search/@x/suspension'
import { isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { EmptyState } from 'shared/ui'
import { tabBarHeightAtom, useBarCollapseOnScroll } from 'shared/ui/layout'
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
  const [isPlayerExpanded] = useAtom(isPlayerExpandedAtom)
  const isSearchBarCollapseSuspended = useIsSearchBarCollapseSuspended()
  const { onScroll } = useBarCollapseOnScroll({
    isSuspended: isPlayerExpanded || isSearchBarCollapseSuspended,
  })

  return (
    <Animated.FlatList
      data={data}
      onScroll={onScroll}
      renderItem={renderItem}
      scrollEventThrottle={16}
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
