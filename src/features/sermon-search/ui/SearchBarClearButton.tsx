import { Ionicons } from '@expo/vector-icons'
import { IconButton } from 'shared/ui/icon-button'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { styles } from './SearchBar.styles'

const CLEAR_LABEL = 'Очистить'
const CLEAR_ICON_SIZE = 28

/**
 * The inline ⊗ chip: resets a non-empty query without closing the search.
 * @param root0 - Component props.
 * @param root0.onPress - Query-clearing handler owned by the search bar.
 */
export const SearchBarClearButton = ({ onPress }: { onPress: () => void }) => {
  const { currentTheme } = useTheme()

  return (
    <IconButton
      onPress={onPress}
      hitSlop={INDENTS.low}
      style={styles.clearButton}
      accessibilityLabel={CLEAR_LABEL}
      Icon={<Ionicons name='close-circle' size={CLEAR_ICON_SIZE} color={currentTheme.textMuted} />}
    />
  )
}
