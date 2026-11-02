import { ListItemBase } from 'entities/list-item'
import { sermonSubtitle } from 'entities/sermon'
import { type APITypes } from 'shared/api'
import { formatRelativeDate } from 'shared/lib/format'
import { AdminSermonRowSkeleton } from 'shared/ui'
import { SermonBadges } from './SermonBadges'

// Дополняет подпись датой создания; некорректная дата оставляет подпись как есть.
const withCreatedDate = (subtitle: string, createdAt: string): string => {
  const timestamp = Date.parse(createdAt)

  if (Number.isNaN(timestamp)) return subtitle

  const date = formatRelativeDate(timestamp)

  return subtitle ? `${subtitle} · ${date}` : date
}

// Карточка проповеди в списке админки: обложка, название, подпись
// (проповедник · ссылка на Писание · дата создания) и бейджи наличия медиа.
export const AdminSermonRow = ({
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
    subtitle={withCreatedDate(sermonSubtitle(item), item.createdAt)}
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
AdminSermonRow.Skeleton = AdminSermonRowSkeleton
