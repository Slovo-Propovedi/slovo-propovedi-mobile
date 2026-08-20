import { Ionicons } from '@expo/vector-icons'
import { useAction } from '@reatom/npm-react'
import { Pressable, StyleSheet } from 'react-native'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { openSearch } from '../model'

const SEARCH_TOGGLE_LABEL = 'Поиск'

export const SearchToggleButton = () => {
  const { currentTheme } = useTheme()
  const openSearchAction = useAction(openSearch)

  return (
    <Pressable
      hitSlop={INDENTS.low}
      accessibilityRole='button'
      onPress={() => void openSearchAction()}
      accessibilityLabel={SEARCH_TOGGLE_LABEL}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons size={24} name='search' color={currentTheme.text} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    padding: INDENTS.medium,
  },
})
