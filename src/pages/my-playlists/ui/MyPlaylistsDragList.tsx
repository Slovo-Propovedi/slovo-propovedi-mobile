import { useAction, useAtom } from '@reatom/npm-react'
import { type ReactElement, useCallback, useRef } from 'react'
import { StyleSheet } from 'react-native'
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist'
import { isSearchOpenAtom } from 'features/sermon-search/@x/suspension'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { type LocalPlaylistData } from 'entities/playlist'
import { nextBarCollapsedState, setBarCollapsed, tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, PLAYER_SIZES } from 'shared/ui/theme'
import { MyPlaylistsRow } from './MyPlaylistsRow'

// Вертикальный список локальных плейлистов с drag-to-reorder. Вне режима
// редактирования drag выключен и тап навигирует; в режиме редактирования
// long-press тянет строку целиком, `onDragEnd` отдаёт итоговый порядок id наверх.
// `listHeader`/`listEmpty`/`listFooter` — слоты для формы оформления, пустого
// состояния и завершающей строки «Создать плейлист».
// Горизонтальный отступ контента задаётся здесь (`INDENTS.medium`) и покрывает
// и шапку с «Избранными», и drag-строки — карточки выровнены по одной вертикали
// с «Избранными» (раньше отступ несла только шапка). Нижний отступ резервирует
// место под мини-плеер и таб-бар (как `PlaylistTrackList`), чтобы последние
// строки не прятались за плавающим плеером — и в обычном режиме, и в режиме
// редактирования.
export const MyPlaylistsDragList = ({
  isDraggingEnabled,
  items,
  listEmpty,
  listFooter,
  listHeader,
  onDeleteItem,
  onDragEnd,
  onPressItem,
}: {
  isDraggingEnabled: boolean
  items: LocalPlaylistData[]
  listEmpty?: ReactElement
  listFooter?: ReactElement
  listHeader?: ReactElement
  onDeleteItem?: (playlistId: string) => void
  onDragEnd: (orderedIds: string[]) => void
  onPressItem: (playlist: LocalPlaylistData) => void
}) => {
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const [isPlayerExpanded] = useAtom(isPlayerExpandedAtom)
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  const applyBarCollapsed = useAction(setBarCollapsed)
  const wasBarCollapsedRef = useRef(false)

  // DraggableFlatList owns its internal animated `onScroll`; `onScrollOffsetChange`
  // is its JS-thread offset hook. The ref applies the same crossing quantization
  // as the animated lists, so the atom is written once per threshold crossing.
  const handleScrollOffsetChange = useCallback(
    (offsetY: number) => {
      if (isSearchOpen || isPlayerExpanded || currentAudio === null) return

      const nextCollapsed = nextBarCollapsedState(offsetY, wasBarCollapsedRef.current)
      if (nextCollapsed === null) return

      wasBarCollapsedRef.current = nextCollapsed
      applyBarCollapsed(nextCollapsed)
    },
    [applyBarCollapsed, currentAudio, isPlayerExpanded, isSearchOpen],
  )

  return (
    <DraggableFlatList
      data={items}
      ListEmptyComponent={listEmpty}
      ListFooterComponent={listFooter}
      ListHeaderComponent={listHeader}
      containerStyle={styles.listContainer}
      keyExtractor={playlist => playlist.id}
      onScrollOffsetChange={handleScrollOffsetChange}
      onDragEnd={({ data }) => onDragEnd(data.map(playlist => playlist.id))}
      contentContainerStyle={{
        paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
        paddingHorizontal: INDENTS.medium,
      }}
      renderItem={({ drag, isActive, item }: RenderItemParams<LocalPlaylistData>) => (
        <MyPlaylistsRow
          drag={drag}
          item={item}
          isActive={isActive}
          onPress={() => onPressItem(item)}
          isDraggingEnabled={isDraggingEnabled}
          onDelete={onDeleteItem ? () => onDeleteItem(item.id) : undefined}
        />
      )}
    />
  )
}

const styles = StyleSheet.create({
  // DraggableFlatList renders its own wrapper without flex; on react-native-web
  // that wrapper sizes to content and the inner ScrollView never scrolls, so the
  // list tail gets clipped by body { overflow: hidden }.
  listContainer: {
    flex: 1,
  },
})
