import { Ionicons } from '@expo/vector-icons'
import { useAction } from '@reatom/npm-react'
import { StyleSheet } from 'react-native'
import { PressableButton } from 'shared/ui/pressable-button'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { openSearch } from '../model'

const SEARCH_TOGGLE_LABEL = 'Поиск'

export const SearchToggleButton = () => {
  const { currentTheme } = useTheme()
  const openSearchAction = useAction(openSearch)

  return (
    <PressableButton
      hitSlop={INDENTS.low}
      onPress={() => void openSearchAction()}
      accessibilityLabel={SEARCH_TOGGLE_LABEL}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons size={24} name='search' color={currentTheme.text} />
    </PressableButton>
  )
}

const styles = StyleSheet.create({
  button: {
    padding: INDENTS.medium,
  },
})
