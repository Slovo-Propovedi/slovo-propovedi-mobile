import { Ionicons } from '@expo/vector-icons'
import { ListItemBase } from 'entities/list-item'
import { type LocalPlaylistData } from 'entities/playlist'
import { useTheme } from 'shared/ui/theme'

const FAVORITES_ICON_SIZE = 24

// Строка «Избранные»: закреплена первой, не перетаскивается. Сердце —
// тот же визуальный маркер, что у карточки на экране «Слушать».
export const MyPlaylistsFavoritesRow = ({
  onPress,
  playlist,
}: {
  onPress: () => void
  playlist: LocalPlaylistData
}) => {
  const { currentTheme } = useTheme()

  return (
    <ListItemBase
      artwork={null}
      onPress={onPress}
      title={playlist.title}
      right={<Ionicons name='heart' size={FAVORITES_ICON_SIZE} color={currentTheme.primary} />}
    />
  )
}
