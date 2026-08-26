import { Pressable, Text } from 'react-native'
import { formatPlaybackRate } from 'shared/lib/player'
import { useTheme } from 'shared/ui/theme'
import type { PlaybackRate } from 'entities/player'
import { styles } from './PlayerMenu.styles'

interface PlayerMenuItemsProps {
  isCached?: boolean
  onDetails: () => void
  onShowSpeed: () => void
  onToggleCache: () => void
  rate: PlaybackRate
}

export const PlayerMenuItems = ({
  isCached,
  onDetails,
  onShowSpeed,
  onToggleCache,
  rate,
}: PlayerMenuItemsProps) => {
  const { currentTheme } = useTheme()

  return (
    <>
      <Pressable onPress={onDetails} style={styles.menuItem} accessibilityRole='button'>
        <Text style={[styles.menuItemText, { color: currentTheme.text }]}>Подробнее</Text>
      </Pressable>
      <Pressable onPress={onToggleCache} style={styles.menuItem} accessibilityRole='button'>
        <Text style={[styles.menuItemText, { color: currentTheme.text }]}>
          {isCached ? 'Удалить из кеша' : 'Добавить в кеш'}
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
