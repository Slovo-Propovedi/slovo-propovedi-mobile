import { useAtom } from '@reatom/npm-react'
import { useCallback } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text } from 'react-native'
import { SearchResultsRow, SearchRowSeparator, useSermonPlayback } from 'features/sermon-search'
import { type SermonData } from 'entities/sermon'
import { EmptyState } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { FONT_SIZES, INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { PreacherSermonsSkeleton } from './PreacherSermonsSkeleton'

const EMPTY_MESSAGE = 'Проповедей пока нет'
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
  const { currentTheme } = useTheme()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { modal, onSermonPress } = useSermonPlayback()

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
        ListEmptyComponent={
          isLoading ? <PreacherSermonsSkeleton /> : <EmptyState message={EMPTY_MESSAGE} />
        }
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight },
        ]}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator style={FOOTER_STYLE} />
          ) : loadMoreFailed ? (
            <TouchableItem
              onPress={() => void loadMore()}
              style={[styles.retry, { backgroundColor: currentTheme.surface }]}
            >
              <Text style={[styles.retryText, { color: currentTheme.primary }]}>{RETRY_LABEL}</Text>
            </TouchableItem>
          ) : undefined
        }
      />
      {modal}
    </>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  retry: { alignItems: 'center', paddingVertical: INDENTS.medium },
  retryText: { fontSize: FONT_SIZES.base },
})
