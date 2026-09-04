import { type ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import { INDENTS } from 'shared/ui/theme'

interface FirstSectionRowProps {
  leadingElement: ReactElement
  right: ReactElement
}

export const FirstSectionRow = ({ leadingElement, right }: FirstSectionRowProps) => (
  <View style={styles.row}>
    <View style={styles.rightColumn}>{right}</View>
    {leadingElement}
  </View>
)

const styles = StyleSheet.create({
  rightColumn: {
    flex: 1,
  },
  row: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: INDENTS.medium,
    paddingHorizontal: INDENTS.medium,
  },
})
