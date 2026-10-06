import { type AnchorRect, MenuDropdown, type MenuItem } from 'shared/ui/menu'
import { type TrackCacheVisualState } from './trackCacheState'

export interface TracksListItemContextMenuProps {
  anchor: AnchorRect | null
  isCached: boolean
  isCacheDisabled?: boolean
  isMenuOpen: boolean
  /** Global sermon-caching setting; when off, the cache action is omitted. */
  isSermonCachingEnabled: boolean
  menuActions?: MenuItem[]
  onClose: () => void
  onToggleCache: () => void
  visualState: TrackCacheVisualState
}

interface CacheActionItem {
  icon?: MenuItem['icon']
  text: string
}

const CACHE_ACTION_ITEMS: Record<Exclude<TrackCacheVisualState, 'playing'>, CacheActionItem> = {
  cached: { icon: 'cloud-offline-outline', text: 'Удалить из офлайн' },
  cloud: { icon: 'cloud-download', text: 'Добавить в офлайн' },
  downloading: { text: 'Остановить добавление в офлайн' },
  queued: { text: 'Убрать из очереди' },
}

const getCacheActionItem = (
  visualState: TrackCacheVisualState,
  isCached: boolean,
): CacheActionItem => {
  // The resolver collapses a playing track to 'playing' regardless of cache
  // status; the menu still needs the cached detail to pick add vs remove.
  if (visualState === 'playing')
    return isCached ? CACHE_ACTION_ITEMS.cached : CACHE_ACTION_ITEMS.cloud

  return CACHE_ACTION_ITEMS[visualState]
}

export const TracksListItemContextMenu = ({
  anchor,
  isCached,
  isCacheDisabled = false,
  isMenuOpen,
  isSermonCachingEnabled,
  menuActions,
  onClose,
  onToggleCache,
  visualState,
}: TracksListItemContextMenuProps) => {
  const cacheAction = getCacheActionItem(visualState, isCached)
  // Caching off in settings: the cache action is meaningless, so the row menu
  // keeps only its non-cache items.
  const items: MenuItem[] = [
    ...(isSermonCachingEnabled
      ? [
          {
            disabled: isCacheDisabled,
            icon: cacheAction.icon,
            onPress: onToggleCache,
            text: cacheAction.text,
          },
        ]
      : []),
    ...(menuActions ?? []),
  ]

  return <MenuDropdown items={items} anchor={anchor} onClose={onClose} visible={isMenuOpen} />
}
