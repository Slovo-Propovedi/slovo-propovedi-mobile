import { Ionicons } from '@expo/vector-icons'
import { useAction } from '@reatom/npm-react'
import { StyleSheet } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { openSearch } from '../model'

const SEARCH_TOGGLE_LABEL = 'Поиск'

export const SearchToggleButton = () => {
  const { currentTheme } = useTheme()
  const openSearchAction = useAction(openSearch)

  return (
    <IconButton
      hitSlop={INDENTS.low}
      style={styles.button}
      onPress={() => void openSearchAction()}
      accessibilityLabel={SEARCH_TOGGLE_LABEL}
      Icon={<Ionicons size={24} name='search' color={currentTheme.text} />}
    />
  )
}

const styles = StyleSheet.create({
  button: {
    padding: INDENTS.medium,
  },
})
