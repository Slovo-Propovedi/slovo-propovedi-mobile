import { Ionicons } from '@expo/vector-icons'
import { IconButton } from 'shared/ui/icon-button'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { styles } from './SearchBar.styles'

const MIC_LABEL = 'Голосовой ввод'
const MIC_ICON_SIZE = 32

/**
 * The pill's voice-search affordance: idle mic outline, filled mic while the
 * recognizer is listening. Always rendered while the query is empty. When
 * speech recognition cannot run (iOS, browser without a backend, denied
 * permission) the mic is tinted as disabled but stays tappable: the press
 * handler shows an info dialog explaining why instead of starting recognition.
 * @param root0 - Component props.
 * @param root0.isListening - Whether voice recognition is currently active.
 * @param root0.isUnavailable - Whether speech recognition cannot run here.
 * @param root0.onPress - Starts voice recognition or explains its unavailability.
 */
export const SearchBarMicButton = ({
  isListening,
  isUnavailable = false,
  onPress,
}: {
  isListening: boolean
  isUnavailable?: boolean
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()
  const iconColor = isListening
    ? currentTheme.primary
    : isUnavailable
      ? currentTheme.textMuted
      : currentTheme.text

  return (
    <IconButton
      onPress={onPress}
      hitSlop={INDENTS.low}
      style={styles.micButton}
      accessibilityLabel={MIC_LABEL}
      Icon={
        <Ionicons
          color={iconColor}
          size={MIC_ICON_SIZE}
          name={isListening ? 'mic' : 'mic-outline'}
        />
      }
    />
  )
}
