import { Text } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { styles } from './SearchBar.styles'

const CLEAR_LABEL = 'Очистить поиск'
const CLEAR_SYMBOL = '✕'

/**
 * The ✕ chip: clears a non-empty query, or closes search when already empty.
 * @param root0 - Component props.
 * @param root0.onPress - Clear/close handler owned by the search bar.
 */
export const SearchBarClearButton = ({ onPress }: { onPress: () => void }) => {
  const { currentTheme } = useTheme()

  return (
    <IconButton
      onPress={onPress}
      hitSlop={INDENTS.low}
      style={styles.clearButton}
      accessibilityLabel={CLEAR_LABEL}
      Icon={
        <Text style={[styles.clearIcon, { color: currentTheme.textMuted }]}>{CLEAR_SYMBOL}</Text>
      }
    />
  )
}
