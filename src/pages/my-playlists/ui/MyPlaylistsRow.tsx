import Ionicons from '@expo/vector-icons/Ionicons'
import { getListItemCardArtworkSize, ListItemBase } from 'entities/list-item'
import { type LocalPlaylistData } from 'entities/playlist'
import { PlaylistLetterAvatar } from 'shared/ui'
import { IconButton } from 'shared/ui/icon-button'
import { COLORS, INDENTS } from 'shared/ui/theme'

const DRAG_LABEL = 'Переместить плейлист'
const DELETE_LABEL = 'Удалить плейлист'
const DELETE_ICON_SIZE = 20
// Card rows carry no own bottom margin (the server list spaces them with a
// separator); this list has none, so the row keeps the previous rhythm.
const ROW_STYLE = { marginBottom: INDENTS.medium }

// Строка локального плейлиста в `card`-варианте — той же геометрии, что
// серверные строки плейлистов в списке раздела (`PlaylistListItem`): плитка
// обложки `getListItemCardArtworkSize()` (производная от размера экрана, не
// хардкод), карточный фон и тот же вертикальный отступ. Вне редактирования тап
// навигирует. В режиме редактирования строка получает drag-ручку (как строки
// админки): перетаскивание стартует только с ручки, long-press по телу строки
// ничего не делает; тап не навигирует. Кнопка удаления показывается только
// когда вызывающий передал `onDelete`.
export const MyPlaylistsRow = ({
  drag,
  isActive,
  isDraggingEnabled,
  item,
  onDelete,
  onPress,
}: {
  drag: () => void
  isActive: boolean
  isDraggingEnabled: boolean
  item: LocalPlaylistData
  onDelete?: () => void
  onPress: () => void
}) => (
  <ListItemBase
    style={ROW_STYLE}
    title={item.title}
    isActive={isActive}
    dragLabel={DRAG_LABEL}
    drag={isDraggingEnabled ? drag : undefined}
    onPress={isDraggingEnabled ? () => undefined : onPress}
    artworkNode={<PlaylistLetterAvatar title={item.title} size={getListItemCardArtworkSize()} />}
    right={
      onDelete ? (
        <IconButton
          onPress={onDelete}
          accessibilityLabel={DELETE_LABEL}
          Icon={<Ionicons name='trash-outline' color={COLORS.error} size={DELETE_ICON_SIZE} />}
        />
      ) : undefined
    }
  />
)
