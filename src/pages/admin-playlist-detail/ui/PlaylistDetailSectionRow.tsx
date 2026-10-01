import { ListItemBase } from 'entities/list-item'
import { type APITypes } from 'shared/api'

// Строка раздела в детали плейлиста: только название.
// Секции из DTO плейлиста не несут надёжного счётчика плейлистов, поэтому
// мета скрыта на этом экране (счётчик корректен в списке разделов админки).
// Тап открывает деталь раздела внутри админки.
export const PlaylistDetailSectionRow = ({
  onPress,
  section,
}: {
  onPress: () => void
  section: APITypes.SectionEntity
}) => <ListItemBase movingTitle onPress={onPress} variant='surface' title={section.title} />
