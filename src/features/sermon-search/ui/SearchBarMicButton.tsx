import { Ionicons } from '@expo/vector-icons'
import { IconButton } from 'shared/ui/icon-button'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { styles } from './SearchBar.styles'

const MIC_LABEL = 'Голосовой ввод'
const MIC_ICON_SIZE = 24

/**
 * The pill's voice-search affordance: idle mic outline, filled mic while the
 * recognizer is listening. Rendered only when the query is empty and the
 * platform recognizer is available.
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
