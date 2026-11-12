import { Ionicons } from '@expo/vector-icons'
import { Platform, StyleSheet } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'

const CLOSE_LABEL = 'Закрыть поиск'
const CLOSE_ICON_SIZE = 48

/**
 * Fills the circular slot beside the search pill and closes the search whole.
 * @param root0 - Component props.
 * @param root0.onPress - Closes the search session.
 */
export const SearchIslandCloseButton = ({ onPress }: { onPress: () => void }) => {
  const { currentTheme } = useTheme()
  // On web, clicking the button blurs the input first; the island then hides
  // the circle before the click lands. Closing on press-in keeps the action
  // reliable there (it is idempotent), while native keeps release semantics.
  const handlePressIn = Platform.OS === 'web' ? onPress : undefined

  return (
    <IconButton
      onPress={onPress}
      style={styles.fill}
      onPressIn={handlePressIn}
      accessibilityLabel={CLOSE_LABEL}
      Icon={<Ionicons name='close-outline' size={CLOSE_ICON_SIZE} color={currentTheme.text} />}
    />
  )
}

const styles = StyleSheet.create({
  fill: {
    height: '100%',
    width: '100%',
  },
})
