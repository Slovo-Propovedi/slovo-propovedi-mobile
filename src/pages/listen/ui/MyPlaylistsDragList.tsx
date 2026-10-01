import { StyleSheet } from 'react-native'
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist'
import { type LocalPlaylistData } from 'entities/playlist'
import { SliderItem, SliderItemSize } from 'shared/ui'
import { INDENTS } from 'shared/ui/theme'

// Слайдер карточек локальных плейлистов с drag-to-reorder. Тянется карточка
// целиком (native `drag` из renderItem), поэтому отдельная ручка не нужна;
// `onDragEnd` отдаёт итоговый порядок наверх. Перетаскивание включается только
// в режиме редактирования (`isDraggingEnabled`): вне него long-press не активирует
// drag, а тап по карточке навигирует как обычно.
export const MyPlaylistsDragList = ({
  isDraggingEnabled,
  items,
  onDragEnd,
  onPressItem,
}: {
  isDraggingEnabled: boolean
  items: LocalPlaylistData[]
  onDragEnd: (orderedIds: string[]) => void
  onPressItem: (playlist: LocalPlaylistData) => void
}) => (
  <DraggableFlatList
    horizontal
    data={items}
    keyExtractor={playlist => playlist.id}
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.content}
    onDragEnd={({ data }) => onDragEnd(data.map(playlist => playlist.id))}
    renderItem={({ drag, isActive, item }: RenderItemParams<LocalPlaylistData>) => (
      <SliderItem
        artwork={null}
        size={SliderItemSize.Small}
        descriptionTitle={item.title}
        style={isActive ? styles.dragging : undefined}
        onLongPress={isDraggingEnabled ? drag : undefined}
        onPress={isDraggingEnabled ? undefined : () => onPressItem(item)}
      />
    )}
  />
)

const styles = StyleSheet.create({
  content: { gap: INDENTS.middle, paddingHorizontal: INDENTS.middle },
  dragging: { opacity: 0.8 },
})
