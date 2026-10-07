import { StyleSheet, View } from 'react-native'
import { INDENTS, useTheme } from 'shared/ui/theme'

export const ResultsListSeparator = () => {
  const { currentTheme } = useTheme()

  return <View style={[styles.separator, { backgroundColor: currentTheme.surface }]} />
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    marginHorizontal: INDENTS.medium,
  },
})
