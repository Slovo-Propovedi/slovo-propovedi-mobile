import { ListItemBase } from 'entities/list-item'
import { formatSermonReference } from 'entities/sermon'
import { type APITypes } from 'shared/api'

const DRAG_LABEL = 'Переместить проповедь'

// Строка проповеди в детали плейлиста: название, подпись и ручка drag.
// Тап по строке открывает деталь проповеди внутри админки.
export const PlaylistDetailSermonRow = ({
  drag,
  isActive,
  item,
  onPress,
}: {
  drag: () => void
  isActive: boolean
  item: APITypes.PlaylistSermon
  onPress: () => void
}) => {
  const reference = formatSermonReference({
    book: item.book,
    chapter: item.chapter,
    verse: item.verse,
  })
  const subtitle = [item.artist, reference].filter(Boolean).join(' · ')

  return (
    <ListItemBase
      drag={drag}
      movingTitle
      onPress={onPress}
      variant='surface'
      title={item.title}
      isActive={isActive}
      subtitle={subtitle}
      dragLabel={DRAG_LABEL}
    />
  )
}
