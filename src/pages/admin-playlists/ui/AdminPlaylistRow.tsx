import { ListItemBase } from 'entities/list-item'
import { formatRelativeDate } from 'shared/lib/format'
import { AdminPlaylistRowSkeleton } from 'shared/ui'
import { type AdminPlaylistsListItem } from '../lib/playlistListItem'

const pluralize = (count: number, forms: [string, string, string]) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]

  return forms[2]
}

const metaLabel = (sermons: number, sections: number) =>
  [
    `${sermons} ${pluralize(sermons, ['проповедь', 'проповеди', 'проповедей'])}`,
    `${sections} ${pluralize(sections, ['раздел', 'раздела', 'разделов'])}`,
  ].join(' · ')

// Дополняет подпись датой создания; некорректная дата оставляет подпись как есть.
const withCreatedDate = (subtitle: string, createdAt: string): string => {
  const timestamp = Date.parse(createdAt)

  if (Number.isNaN(timestamp)) return subtitle

  const date = formatRelativeDate(timestamp)

  return subtitle ? `${subtitle} · ${date}` : date
}

// Карточка плейлиста в списке админки: обложка, название, счётчики связей
// и дата создания.
export const AdminPlaylistRow = ({
  item,
  onPress,
}: {
  item: AdminPlaylistsListItem
  onPress: () => void
}) => (
  <ListItemBase
    movingTitle
    onPress={onPress}
    variant='surface'
    title={item.title}
    artwork={item.artwork}
    subtitle={withCreatedDate(metaLabel(item.sermonsCount, item.sectionsCount), item.createdAt)}
  />
)

// Скелетон прикреплён к строке как `AdminPlaylistRow.Skeleton` — единый
// источник плейсхолдера для этой сущности.
AdminPlaylistRow.Skeleton = AdminPlaylistRowSkeleton
