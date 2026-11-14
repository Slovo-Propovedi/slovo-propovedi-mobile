import { useAtom } from '@reatom/npm-react'
import { useCallback } from 'react'
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native'
import { SearchResultsRow, SearchRowSeparator, useSermonPlayback } from 'features/sermon-search'
import { type SermonData } from 'entities/sermon'
import { EmptyState } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, PLAYER_SIZES } from 'shared/ui/theme'
import { PreacherListActionRow } from './PreacherListActionRow'
import { PreacherSermonsSkeleton } from './PreacherSermonsSkeleton'

const EMPTY_MESSAGE = 'Проповедей пока нет'
const LOAD_MORE_LABEL = 'Загрузить ещё'
const RETRY_LABEL = 'Повторить загрузку'
const FOOTER_STYLE = { paddingVertical: INDENTS.medium }

export const PreacherSermonsList = ({
  hasMore,
  isLoading,
  isLoadingMore,
  items,
  loadMore,
  loadMoreFailed,
}: {
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  items: SermonData[]
  loadMore: () => Promise<void>
  loadMoreFailed: boolean
}) => {
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { modal, onSermonPress } = useSermonPlayback()
  // An exhausted auto-continue run can end with hasMore but no rows; an empty
  // list cannot scroll, so onEndReached would never reach the remaining pages.
  const showManualLoadMore = hasMore && !isLoading && items.length === 0

  const renderItem = useCallback(
    ({ item }: { item: SermonData }) => (
      <SearchResultsRow sermon={item} inHistory={false} onPress={onSermonPress} />
    ),
    [onSermonPress],
  )

  return (
    <>
      <FlatList
        data={items}
        renderItem={renderItem}
        onEndReachedThreshold={0.4}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={SearchRowSeparator}
        onEndReached={() => {
          if (hasMore && !isLoadingMore) void loadMore()
        }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight },
        ]}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator style={FOOTER_STYLE} />
          ) : loadMoreFailed ? (
            <PreacherListActionRow label={RETRY_LABEL} onPress={() => void loadMore()} />
          ) : undefined
        }
        ListEmptyComponent={
          isLoading ? (
            <PreacherSermonsSkeleton />
          ) : showManualLoadMore ? (
            <PreacherListActionRow label={LOAD_MORE_LABEL} onPress={() => void loadMore()} />
          ) : (
            <EmptyState message={EMPTY_MESSAGE} />
          )
        }
      />
      {modal}
    </>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
})
