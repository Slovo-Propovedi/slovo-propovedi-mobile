/* eslint-disable react-refresh/only-export-components -- Skeleton is attached via composition API */
import { ListItemBase } from 'entities/list-item'
import { sermonSubtitle } from 'entities/sermon'
import { type APITypes } from 'shared/api'
import { AdminSermonRowSkeleton } from 'shared/ui'
import { SermonBadges } from './SermonBadges'

// Карточка проповеди в списке админки: обложка, название, подпись
// (проповедник · ссылка на Писание) и бейджи наличия медиа.
const AdminSermonRowBase = ({
  item,
  onPress,
}: {
  item: APITypes.SermonEntity
  onPress: () => void
}) => (
  <ListItemBase
    movingTitle
    onPress={onPress}
    variant='surface'
    title={item.title}
    artwork={item.artwork}
    subtitle={sermonSubtitle(item)}
    badges={
      <SermonBadges
        hasAudio={Boolean(item.audioUrl)}
        hasText={Boolean(item.textFileUrl)}
        hasYoutube={Boolean(item.youtubeUrl)}
      />
    }
  />
)

// Скелетон прикреплён к строке как `AdminSermonRow.Skeleton`: единый источник
// плейсхолдера для этой сущности, а не отдельная копия рядом.
export const AdminSermonRow = Object.assign(AdminSermonRowBase, {
  Skeleton: AdminSermonRowSkeleton,
})
