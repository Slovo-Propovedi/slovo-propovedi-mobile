import { ListItemBase } from 'entities/list-item'
import { type APITypes } from 'shared/api'
import { AdminSectionRowSkeleton } from 'shared/ui'
import { AdminSectionBadges } from './AdminSectionBadges'

const DRAG_LABEL = 'Переместить раздел'

const playlistCountLabel = (count: number) => `${count} ${pluralizePlaylists(count)}`

const pluralizePlaylists = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'плейлист'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'плейлиста'
  return 'плейлистов'
}

// Строка раздела в списке админки: тап открывает деталь, ручка запускает drag.
export const AdminSectionRow = ({
  drag,
  isActive,
  item,
  onPress,
}: {
  drag: () => void
  isActive: boolean
  item: APITypes.SectionEntity
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
    subtitle={item.description ?? playlistCountLabel(item.playlists.length)}
    badges={<AdminSectionBadges itemsSize={item.itemsSize} transform={item.transform} />}
  />
)

// Скелетон прикреплён к строке как `AdminSectionRow.Skeleton` — единый источник
// плейсхолдера для этой сущности.
AdminSectionRow.Skeleton = AdminSectionRowSkeleton
