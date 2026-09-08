import { useAtom } from '@reatom/npm-react'
import { Pressable, Text } from 'react-native'
import { type TrackCacheVisualState } from 'shared/lib/audio-cache'
import { formatPlaybackRate } from 'shared/lib/player'
import { isOnlineAtom } from 'shared/model'
import { useTheme } from 'shared/ui/theme'
import type { PlaybackRate } from 'entities/player'
import { styles } from './PlayerMenu.styles'

interface PlayerMenuItemsProps {
  isCached?: boolean
  onDetails: () => void
  onShowSpeed: () => void
  onToggleCache: () => void
  rate: PlaybackRate
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
  if (visualState === 'playing') return isCached ? 'Удалить из кеша' : 'Добавить в кеш'
  return CACHE_ACTION_LABELS[visualState]
}

export const PlayerMenuItems = ({
  isCached,
  onDetails,
  onShowSpeed,
  onToggleCache,
  rate,
  visualState,
}: PlayerMenuItemsProps) => {
  const { currentTheme } = useTheme()
  const [isOnline] = useAtom(isOnlineAtom)
  // Stop/remove-from-queue actions must stay enabled; only the cloud branch
  // (starting a download) is disabled while offline.
  const isCacheDisabled = !isOnline && !isCached && visualState === 'cloud'

  return (
    <>
      <Pressable onPress={onDetails} style={styles.menuItem} accessibilityRole='button'>
        <Text style={[styles.menuItemText, { color: currentTheme.text }]}>Подробнее</Text>
      </Pressable>
      <Pressable
        accessibilityRole='button'
        onPress={isCacheDisabled ? undefined : onToggleCache}
        accessibilityState={isCacheDisabled ? { disabled: true } : undefined}
        style={[styles.menuItem, isCacheDisabled && styles.menuItemDisabled]}
      >
        <Text
          style={[
            styles.menuItemText,
            { color: isCacheDisabled ? currentTheme.textMuted : currentTheme.text },
          ]}
        >
          {getCacheActionLabel(visualState, isCached ?? false)}
        </Text>
      </Pressable>
      <Pressable
        onPress={onShowSpeed}
        accessibilityRole='button'
        style={styles.menuItemRow}
        accessibilityLabel='Скорость воспроизведения'
      >
        <Text style={[styles.menuItemText, { color: currentTheme.text, flexShrink: 1 }]}>
          Скорость воспроизведения
        </Text>
        <Text style={[styles.menuItemValue, { color: currentTheme.textMuted, flexShrink: 0 }]}>
          {formatPlaybackRate(rate)}
        </Text>
      </Pressable>
      <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
        <Text style={[styles.menuItemTextDisabled, { color: currentTheme.textMuted }]}>
          Добавить в плейлист
        </Text>
      </Pressable>
      <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
        <Text style={[styles.menuItemTextDisabled, { color: currentTheme.textMuted }]}>
          Настройки звука
        </Text>
      </Pressable>
      <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
        <Text style={[styles.menuItemTextDisabled, { color: currentTheme.textMuted }]}>
          Поделиться
        </Text>
      </Pressable>
    </>
  )
}
