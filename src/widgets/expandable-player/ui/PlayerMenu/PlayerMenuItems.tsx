import { useAtom } from '@reatom/npm-react'
import { Pressable, Text } from 'react-native'
import { sermonCachingEnabledAtom, type TrackCacheVisualState } from 'entities/offline-cache'
import { type PlaybackRate } from 'entities/player'
import { formatPlaybackRate } from 'shared/lib/player'
import { isOnlineAtom } from 'shared/model'
import { PressableButton } from 'shared/ui/pressable-button'
import { useTheme } from 'shared/ui/theme'
import { styles } from './PlayerMenu.styles'

const ADD_TO_OFFLINE_TEXT = 'Добавить в офлайн'
const REMOVE_CACHE_TEXT = 'Удалить из офлайн'
const STOP_CACHING_TEXT = 'Остановить добавление в офлайн'
const REMOVE_FROM_QUEUE_TEXT = 'Убрать из очереди'
const SOUND_SETTINGS_TEXT = 'Настройки звука'
const ADD_TO_PLAYLIST_TEXT = 'Добавить в плейлист'

const OFFLINE_ACTION_LABELS: Record<TrackCacheVisualState, string> = {
  cached: REMOVE_CACHE_TEXT,
  cloud: ADD_TO_OFFLINE_TEXT,
  downloading: STOP_CACHING_TEXT,
  playing: ADD_TO_OFFLINE_TEXT,
  queued: REMOVE_FROM_QUEUE_TEXT,
}

const getCacheActionLabel = (visualState: TrackCacheVisualState, isCached: boolean): string => {
  if (visualState === 'playing') return isCached ? REMOVE_CACHE_TEXT : ADD_TO_OFFLINE_TEXT
  return OFFLINE_ACTION_LABELS[visualState]
}

export const PlayerMenuItems = ({
  isCached,
  onAddToPlaylist,
  onDetails,
  onOpenSoundSettings,
  onShowSpeed,
  onToggleCache,
  rate,
  visualState,
}: {
  isCached?: boolean
  onAddToPlaylist?: () => void
  onDetails: () => void
  onOpenSoundSettings: () => void
  onShowSpeed: () => void
  onToggleCache: () => void
  rate: PlaybackRate
  visualState: TrackCacheVisualState
}) => {
  const { currentTheme } = useTheme()
  const [isOnline] = useAtom(isOnlineAtom)
  const [isSermonCachingEnabled] = useAtom(sermonCachingEnabledAtom)
  // Stop/remove-from-queue actions must stay enabled; only the cloud branch
  // (starting a download) is disabled while offline.
  const isCacheDisabled = !isOnline && !isCached && visualState === 'cloud'

  return (
    <>
      <PressableButton onPress={onDetails} style={styles.menuItem}>
        <Text style={[styles.menuItemText, { color: currentTheme.text }]}>Подробнее</Text>
      </PressableButton>
      {/* Caching off in settings: the offline action is meaningless, so the
          row is not rendered at all. */}
      {isSermonCachingEnabled && (
        <PressableButton
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
        </PressableButton>
      )}
      <PressableButton
        onPress={onShowSpeed}
        style={styles.menuItemRow}
        accessibilityLabel='Скорость воспроизведения'
      >
        <Text style={[styles.menuItemText, { color: currentTheme.text, flexShrink: 1 }]}>
          Скорость воспроизведения
        </Text>
        <Text style={[styles.menuItemValue, { color: currentTheme.textMuted, flexShrink: 0 }]}>
          {formatPlaybackRate(rate)}
        </Text>
      </PressableButton>
      {onAddToPlaylist ? (
        <PressableButton style={styles.menuItem} onPress={onAddToPlaylist}>
          <Text style={[styles.menuItemText, { color: currentTheme.text }]}>
            {ADD_TO_PLAYLIST_TEXT}
          </Text>
        </PressableButton>
      ) : (
        <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
          <Text style={[styles.menuItemTextDisabled, { color: currentTheme.textMuted }]}>
            {ADD_TO_PLAYLIST_TEXT}
          </Text>
        </Pressable>
      )}
      <PressableButton
        style={styles.menuItemRow}
        onPress={onOpenSoundSettings}
        accessibilityLabel={SOUND_SETTINGS_TEXT}
      >
        <Text style={[styles.menuItemText, { color: currentTheme.text, flexShrink: 1 }]}>
          {SOUND_SETTINGS_TEXT}
        </Text>
      </PressableButton>
      <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
        <Text style={[styles.menuItemTextDisabled, { color: currentTheme.textMuted }]}>
          Поделиться
        </Text>
      </Pressable>
    </>
  )
}
