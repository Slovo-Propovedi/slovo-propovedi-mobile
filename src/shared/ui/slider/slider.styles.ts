import { StyleSheet } from 'react-native'
import { INDENTS } from '../theme/themed'
import { type ThemeColors } from '../theme/types'

export const createSliderStyles = (theme: ThemeColors) =>
  StyleSheet.create({
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
      color: theme.text,
      fontWeight: 'bold',
      paddingBottom: INDENTS.middle,
      paddingLeft: INDENTS.lowest,
    },
  })
