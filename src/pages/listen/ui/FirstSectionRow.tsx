import { type ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'

interface FirstSectionRowProps {
  leadingElement: ReactElement
  right: ReactElement
}

export const FirstSectionRow = ({ leadingElement, right }: FirstSectionRowProps) => (
  <View style={styles.row}>
    {leadingElement}
    <View style={styles.rightColumn}>{right}</View>
  </View>
)

const styles = StyleSheet.create({
  rightColumn: {
    flex: 1,
  },
  row: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
})
