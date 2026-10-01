import { StyleSheet, View } from 'react-native'
import { type LocalPlaylistData } from 'entities/playlist'
import { EmptyState } from 'shared/ui'
import { INDENTS } from 'shared/ui/theme'
import { MyPlaylistsDragList } from './MyPlaylistsDragList'
import { MyPlaylistsFavoritesRow } from './MyPlaylistsFavoritesRow'

const EMPTY_MESSAGE = 'Своих плейлистов пока нет'

// Обычный (просмотровый) режим экрана «Мои плейлисты»: закреплённая строка
// «Избранные» и вертикальный список остальных плейлистов без drag.
export const MyPlaylistsNormalView = ({
  favorites,
  onPressFavorites,
  onPressPlaylist,
  orderedRest,
}: {
  favorites?: LocalPlaylistData
  onPressFavorites: () => void
  onPressPlaylist: (playlist: LocalPlaylistData) => void
  orderedRest: LocalPlaylistData[]
}) => (
  <>
    {favorites ? (
      <View style={styles.favorites}>
        <MyPlaylistsFavoritesRow playlist={favorites} onPress={onPressFavorites} />
      </View>
    ) : null}
    <View style={styles.list}>
      {orderedRest.length === 0 ? (
        <EmptyState message={EMPTY_MESSAGE} />
      ) : (
        <MyPlaylistsDragList
          items={orderedRest}
          isDraggingEnabled={false}
          onDragEnd={() => undefined}
          onPressItem={onPressPlaylist}
        />
      )}
    </View>
  </>
)

const styles = StyleSheet.create({
  favorites: { paddingHorizontal: INDENTS.medium, paddingVertical: INDENTS.middle },
  list: { flex: 1 },
})
