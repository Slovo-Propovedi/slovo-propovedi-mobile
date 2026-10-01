/* eslint-disable react-refresh/only-export-components -- Skeleton is attached via composition API */
import { ListItemBase } from 'entities/list-item'
import { type APITypes } from 'shared/api'
import { AdminPlaylistRowSkeleton } from 'shared/ui'

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

// Карточка плейлиста в списке админки: обложка, название и счётчики связей.
const AdminPlaylistRowBase = ({
  item,
  onPress,
}: {
  item: APITypes.PlaylistEntity
  onPress: () => void
}) => (
  <ListItemBase
    movingTitle
    onPress={onPress}
    variant='surface'
    title={item.title}
    artwork={item.artwork}
    subtitle={metaLabel(item.sermons.length, item.sections.length)}
  />
)

// Скелетон прикреплён к строке как `AdminPlaylistRow.Skeleton` — единый
// источник плейсхолдера для этой сущности.
export const AdminPlaylistRow = Object.assign(AdminPlaylistRowBase, {
  Skeleton: AdminPlaylistRowSkeleton,
})
