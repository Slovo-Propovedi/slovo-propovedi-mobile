import { StyleSheet } from 'react-native'
import { INDENTS } from 'shared/themed'

export const sliderStyles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'column-reverse',
    gap: INDENTS.middle,
  },
  row: {
    flexDirection: 'row',
    gap: INDENTS.middle,
    maxWidth: '100%',
    width: '100%',
  },
  slider: { maxWidth: '100%' },
  title: {
    fontWeight: 'bold',
    paddingBottom: INDENTS.middle,
    paddingLeft: INDENTS.lowest,
  },
})
