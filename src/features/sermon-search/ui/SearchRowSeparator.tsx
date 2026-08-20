import { StyleSheet, View } from 'react-native'
import { INDENTS, useTheme } from 'shared/ui/theme'

export const SearchRowSeparator = () => {
  const { currentTheme } = useTheme()

  return <View style={[styles.separator, { backgroundColor: currentTheme.surface }]} />
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    marginLeft: 48 + INDENTS.middle + INDENTS.medium,
    marginRight: INDENTS.medium,
  },
})
