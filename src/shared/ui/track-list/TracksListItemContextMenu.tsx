import { Ionicons } from '@expo/vector-icons'
import { type ComponentProps } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { type TrackCacheVisualState } from 'shared/lib/audio-cache'
import { AnchoredDropdown, type AnchorRect } from 'shared/ui/anchored-dropdown'
import { type ThemeColors } from '../theme'
import { createTracksListStyles } from './styles'

export interface MenuAction {
  icon?: ComponentProps<typeof Ionicons>['name']
  onPress: () => void
  text: string
}

export interface TracksListItemContextMenuProps {
  anchor: AnchorRect | null
  isCached: boolean
  isCacheDisabled?: boolean
  isMenuOpen: boolean
  menuActions?: MenuAction[]
  onClose: () => void
  onToggleCache: () => void
  theme: ThemeColors
  visualState: TrackCacheVisualState
}

const CACHE_ACTION_LABELS: Record<TrackCacheVisualState, string> = {
  cached: 'Удалить из кеша',
  cloud: 'Добавить в кеш',
  downloading: 'Остановить кеширование',
  playing: 'Добавить в кеш',
  queued: 'Убрать из очереди',
}

const getCacheActionLabel = (visualState: TrackCacheVisualState, isCached: boolean): string => {
  // The resolver collapses a playing track to 'playing' regardless of cache
  // status; the menu still needs the cached detail to pick add vs remove.
  if (visualState === 'playing') return isCached ? 'Удалить из кеша' : 'Добавить в кеш'
  return CACHE_ACTION_LABELS[visualState]
}

export const TracksListItemContextMenu = ({
  anchor,
  isCached,
  isCacheDisabled = false,
  isMenuOpen,
  menuActions,
  onClose,
  onToggleCache,
  theme,
  visualState,
}: TracksListItemContextMenuProps) => {
  const tracksListStyles = createTracksListStyles(theme)

  const renderItems = () => (
    <>
      <Pressable
        accessibilityRole='button'
        onPress={isCacheDisabled ? undefined : onToggleCache}
        accessibilityState={isCacheDisabled ? { disabled: true } : undefined}
        style={[tracksListStyles.contextMenuItem, isCacheDisabled && localStyles.cacheItemDisabled]}
      >
        <Text
          style={[
            tracksListStyles.contextMenuItemText,
            isCacheDisabled && { color: theme.textMuted },
          ]}
        >
          {getCacheActionLabel(visualState, isCached)}
        </Text>
      </Pressable>
      {menuActions?.map((action, index) => (
        <Pressable
          accessibilityRole='button'
          key={`${action.text}-${index}`}
          style={tracksListStyles.contextMenuItem}
          onPress={() => {
            action.onPress()
            onClose()
          }}
        >
          <View style={localStyles.actionRow}>
            {action.icon && (
              <Ionicons
                size={18}
                name={action.icon}
                color={theme.text}
                style={localStyles.actionIcon}
              />
            )}
            <Text style={tracksListStyles.contextMenuItemText}>{action.text}</Text>
          </View>
        </Pressable>
      ))}
    </>
  )

  return (
    <AnchoredDropdown
      anchor={anchor}
      onClose={onClose}
      visible={isMenuOpen}
      menuStyle={tracksListStyles.dropdownMenu}
    >
      {renderItems()}
    </AnchoredDropdown>
  )
}

const localStyles = StyleSheet.create({
  actionIcon: {
    marginRight: 8,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  cacheItemDisabled: { opacity: 0.5 },
})
