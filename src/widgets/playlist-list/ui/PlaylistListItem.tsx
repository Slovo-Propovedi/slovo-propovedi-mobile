import { getListItemCardArtworkSize, ListItemBase } from 'entities/list-item'
import { PlaylistLetterAvatar } from 'shared/ui'
import { type PlaylistListItemData } from '../model'

// Строка плейлиста в списке. Слот обложки обязателен: без artwork/artworkNode он
// схлопывался бы, и высота строки падала. Поэтому при `artwork: null` в тот же
// слот кладётся плитка-буква (`PlaylistLetterAvatar`) стандартного размера
// `getListItemCardArtworkSize()` — каждая строка получает одинаковую высоту.
// `artworkNode` (маркер «Избранные»/«Создать плейлист») имеет приоритет над
// обложкой и фолбэк-плиткой.
export const PlaylistListItem = ({
  item,
  onPress,
}: {
  item: PlaylistListItemData
  onPress: () => void
}) => (
  <ListItemBase
    onPress={onPress}
    title={item.title}
    artwork={item.artwork}
    subtitle={item.subtitle}
    artworkNode={
      item.artworkNode ??
      (item.artwork == null ? (
        <PlaylistLetterAvatar title={item.title} size={getListItemCardArtworkSize()} />
      ) : undefined)
    }
  />
)
