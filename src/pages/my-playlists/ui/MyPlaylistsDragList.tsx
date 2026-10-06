import { useAtom } from '@reatom/npm-react'
import { type ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist'
import { type LocalPlaylistData } from 'entities/playlist'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, PLAYER_SIZES } from 'shared/ui/theme'
import { MyPlaylistsRow } from './MyPlaylistsRow'

// Вертикальный список локальных плейлистов с drag-to-reorder. Вне режима
// редактирования drag выключен и тап навигирует; в режиме редактирования
// long-press тянет строку целиком, `onDragEnd` отдаёт итоговый порядок id наверх.
// `listHeader`/`listEmpty` — слоты для формы оформления и пустого состояния.
// Нижний отступ резервирует место под мини-плеер и таб-бар (как `PlaylistTrackList`),
// чтобы последние строки не прятались за плавающим плеером — и в обычном режиме,
// и в режиме редактирования.
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
}) => {
  const [tabBarHeight] = useAtom(tabBarHeightAtom)

  return (
    <DraggableFlatList
      data={items}
      ListEmptyComponent={listEmpty}
      ListHeaderComponent={listHeader}
      keyExtractor={playlist => playlist.id}
      onDragEnd={({ data }) => onDragEnd(data.map(playlist => playlist.id))}
      contentContainerStyle={{
        paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
      }}
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
}

const styles = StyleSheet.create({
  row: { marginBottom: INDENTS.middle },
})
