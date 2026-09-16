import { type TrackCacheVisualState } from 'shared/lib/audio-cache'
import { type AnchorRect, MenuDropdown, type MenuItem } from 'shared/ui/menu'

export type MenuAction = MenuItem

export interface TracksListItemContextMenuProps {
  anchor: AnchorRect | null
  isCached: boolean
  isCacheDisabled?: boolean
  isMenuOpen: boolean
  menuActions?: MenuAction[]
  onClose: () => void
  onToggleCache: () => void
  visualState: TrackCacheVisualState
}

const ADD_TO_OFFLINE_TEXT = 'Добавить в офлайн'
const REMOVE_CACHE_TEXT = 'Удалить из офлайн'
const STOP_CACHING_TEXT = 'Остановить добавление в офлайн'
const REMOVE_FROM_QUEUE_TEXT = 'Убрать из очереди'

const ADD_TO_OFFLINE_ICON = 'cloud-download' as const
const REMOVE_CACHE_ICON = 'trash-outline' as const

interface CacheActionItem {
  icon?: MenuItem['icon']
  text: string
}

const CACHE_ACTION_ITEMS: Record<TrackCacheVisualState, CacheActionItem> = {
  cached: { icon: REMOVE_CACHE_ICON, text: REMOVE_CACHE_TEXT },
  cloud: { icon: ADD_TO_OFFLINE_ICON, text: ADD_TO_OFFLINE_TEXT },
  downloading: { text: STOP_CACHING_TEXT },
  playing: { icon: ADD_TO_OFFLINE_ICON, text: ADD_TO_OFFLINE_TEXT },
  queued: { text: REMOVE_FROM_QUEUE_TEXT },
}

const getCacheActionItem = (
  visualState: TrackCacheVisualState,
  isCached: boolean,
): CacheActionItem => {
  // The resolver collapses a playing track to 'playing' regardless of cache
  // status; the menu still needs the cached detail to pick add vs remove.
  if (visualState === 'playing')
    return isCached
      ? { icon: REMOVE_CACHE_ICON, text: REMOVE_CACHE_TEXT }
      : { icon: ADD_TO_OFFLINE_ICON, text: ADD_TO_OFFLINE_TEXT }

  return CACHE_ACTION_ITEMS[visualState]
}

export const TracksListItemContextMenu = ({
  anchor,
  isCached,
  isCacheDisabled = false,
  isMenuOpen,
  menuActions,
  onClose,
  onToggleCache,
  visualState,
}: TracksListItemContextMenuProps) => {
  const cacheAction = getCacheActionItem(visualState, isCached)
  const items: MenuItem[] = [
    {
      disabled: isCacheDisabled,
      icon: cacheAction.icon,
      onPress: onToggleCache,
      text: cacheAction.text,
    },
    ...(menuActions ?? []),
  ]

  return <MenuDropdown items={items} anchor={anchor} onClose={onClose} visible={isMenuOpen} />
}
