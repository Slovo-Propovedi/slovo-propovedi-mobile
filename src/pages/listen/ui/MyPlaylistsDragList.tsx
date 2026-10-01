import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist'
import { type LocalPlaylistData } from 'entities/playlist'
import { SliderItem } from 'shared/ui/slider/slider-item/slider-item'
import { SliderItemSize } from 'shared/ui/slider/slider-item/slider-item.types'
import { INDENTS } from 'shared/ui/theme'

// Слайдер карточек локальных плейлистов с drag-to-reorder. Тянется карточка
// целиком (native `drag` из renderItem), поэтому отдельная ручка не нужна;
// `onDragEnd` отдаёт итоговый порядок наверх.
export const MyPlaylistsDragList = ({
  items,
  onDragEnd,
  onPressItem,
}: {
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
        onLongPress={drag}
        testID={SLIDER_ITEM_ID}
        size={SliderItemSize.Small}
        descriptionTitle={item.title}
        onPress={() => onPressItem(item)}
        style={isActive ? styles.dragging : undefined}
      />
    )}
  />
)

const SLIDER_ITEM_ID = 'slider-item'

const styles = {
  content: { gap: INDENTS.middle, paddingHorizontal: INDENTS.middle },
  dragging: { opacity: 0.8 },
} as const
