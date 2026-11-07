import { Ionicons } from '@expo/vector-icons'
import { IconButton } from 'shared/ui/icon-button'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { styles } from './SearchBar.styles'

const MIC_LABEL = 'Голосовой ввод'
const MIC_ICON_SIZE = 24

/**
 * The pill's voice-search affordance: idle mic outline, filled mic while the
 * recognizer is listening. Always rendered while the query is empty; on a
 * platform without a recognizer (iOS, browser without Web Speech) the press
 * handler reports the feature as unavailable instead of starting recognition.
 * @param root0 - Component props.
 * @param root0.isListening - Whether voice recognition is currently active.
 * @param root0.onPress - Starts voice recognition.
 */
export const SearchBarMicButton = ({
  isListening,
  onPress,
}: {
  isListening: boolean
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <IconButton
      onPress={onPress}
      hitSlop={INDENTS.low}
      style={styles.micButton}
      accessibilityLabel={MIC_LABEL}
      Icon={
        <Ionicons
          size={MIC_ICON_SIZE}
          name={isListening ? 'mic' : 'mic-outline'}
          color={isListening ? currentTheme.primary : currentTheme.text}
        />
      }
    />
  )
}
