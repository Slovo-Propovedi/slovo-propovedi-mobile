import { ListItemBase } from 'entities/list-item'
import { type LocalPlaylistData } from 'entities/playlist'

// Строка локального плейлиста: вне редактирования тап навигирует, в режиме
// редактирования long-press тянет строку целиком (native `drag`), а тап не
// навигирует. Ручка drag не рендерится — строка тянется сама.
export const MyPlaylistsRow = ({
  drag,
  isActive,
  isDraggingEnabled,
  item,
  onPress,
}: {
  drag: () => void
  isActive: boolean
  isDraggingEnabled: boolean
  item: LocalPlaylistData
  onPress: () => void
}) => (
  <ListItemBase
    artwork={null}
    title={item.title}
    isActive={isActive}
    onLongPress={isDraggingEnabled ? drag : undefined}
    onPress={isDraggingEnabled ? () => undefined : onPress}
  />
)
