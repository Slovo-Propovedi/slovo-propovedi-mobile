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
    // The button is a direct child of the ScrollView, whose content container
    // stretches children to full width. Without this the 48pt base style's
    // `alignItems: 'center'` would centre the icon in that stretched row.
    alignSelf: 'flex-start',
    padding: INDENTS.medium,
  },
})
