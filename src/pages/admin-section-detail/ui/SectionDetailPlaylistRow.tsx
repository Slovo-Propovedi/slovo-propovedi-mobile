import { ListItemBase } from 'entities/list-item'
import { type APITypes } from 'shared/api'

const DRAG_LABEL = 'Переместить плейлист'

// Строка плейлиста в детали раздела: тап открывает плейлист, ручка — drag.
export const SectionDetailPlaylistRow = ({
  drag,
  isActive,
  item,
  onPress,
}: {
  drag: () => void
  isActive: boolean
  item: APITypes.SectionPlaylist
  onPress: () => void
}) => (
  <ListItemBase
    drag={drag}
    movingTitle
    onPress={onPress}
    variant='surface'
    title={item.title}
    isActive={isActive}
    dragLabel={DRAG_LABEL}
    subtitle={`${item.sermons.length} проповедей`}
  />
)
