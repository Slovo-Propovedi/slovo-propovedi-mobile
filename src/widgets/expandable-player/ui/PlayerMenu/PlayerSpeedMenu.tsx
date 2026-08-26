import { Entypo } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'
import { PLAYBACK_RATES, type PlaybackRate } from 'entities/player'
import { formatPlaybackRate } from 'shared/lib/player'
import { useTheme } from 'shared/ui/theme'
import { styles } from './PlayerMenu.styles'

interface PlayerSpeedMenuProps {
  currentRate: PlaybackRate
  onBack: () => void
  onSelect: (rate: PlaybackRate) => void
}

export const PlayerSpeedMenu = ({ currentRate, onBack, onSelect }: PlayerSpeedMenuProps) => {
  const { currentTheme } = useTheme()

  return (
    <View>
      <Pressable
        onPress={onBack}
        accessibilityLabel='Назад'
        accessibilityRole='button'
        style={styles.speedHeader}
      >
        <Entypo
          size={18}
          name='chevron-left'
          color={currentTheme.text}
          style={styles.speedHeaderBack}
        />
        <Text style={[styles.speedHeaderText, { color: currentTheme.text }]}>
          Скорость воспроизведения
        </Text>
      </Pressable>
      {PLAYBACK_RATES.map(rate => {
        const isActive = rate === currentRate
        return (
          <Pressable
            key={rate}
            accessibilityRole='button'
            onPress={() => onSelect(rate)}
            accessibilityState={{ selected: isActive }}
            style={[styles.menuItem, styles.menuItemRow]}
            accessibilityLabel={`Скорость ${formatPlaybackRate(rate)}`}
          >
            <Text
              style={[
                styles.menuItemText,
                {
                  color: isActive ? currentTheme.primary : currentTheme.text,
                },
              ]}
            >
              {formatPlaybackRate(rate)}
            </Text>
            {isActive && (
              <Entypo
                size={14}
                name='check'
                color={currentTheme.primary}
                style={styles.speedCheckIcon}
              />
            )}
          </Pressable>
        )
      })}
    </View>
  )
}
