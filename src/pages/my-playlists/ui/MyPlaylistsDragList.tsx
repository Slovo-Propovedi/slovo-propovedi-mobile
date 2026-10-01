import { type ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist'
import { type LocalPlaylistData } from 'entities/playlist'
import { INDENTS } from 'shared/ui/theme'
import { MyPlaylistsRow } from './MyPlaylistsRow'

// Вертикальный список локальных плейлистов с drag-to-reorder. Вне режима
// редактирования drag выключен и тап навигирует; в режиме редактирования
// long-press тянет строку целиком, `onDragEnd` отдаёт итоговый порядок id наверх.
// `listHeader`/`listEmpty` — слоты для формы оформления и пустого состояния.
export const MyPlaylistsDragList = ({
  isDraggingEnabled,
  items,
  listEmpty,
  listHeader,
  onDragEnd,
  onPressItem,
}: {
  isDraggingEnabled: boolean
  items: LocalPlaylistData[]
  listEmpty?: ReactElement
  listHeader?: ReactElement
  onDragEnd: (orderedIds: string[]) => void
  onPressItem: (playlist: LocalPlaylistData) => void
}) => (
  <DraggableFlatList
    data={items}
    ListEmptyComponent={listEmpty}
    ListHeaderComponent={listHeader}
    keyExtractor={playlist => playlist.id}
    contentContainerStyle={styles.content}
    onDragEnd={({ data }) => onDragEnd(data.map(playlist => playlist.id))}
    renderItem={({ drag, isActive, item }: RenderItemParams<LocalPlaylistData>) => (
      <View style={styles.row}>
        <MyPlaylistsRow
          drag={drag}
          item={item}
          isActive={isActive}
          onPress={() => onPressItem(item)}
          isDraggingEnabled={isDraggingEnabled}
        />
      </View>
    )}
  />
)

const styles = StyleSheet.create({
  content: { paddingBottom: INDENTS.middle },
  row: { marginBottom: INDENTS.middle },
})
