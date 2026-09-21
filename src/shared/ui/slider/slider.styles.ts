import { StyleSheet } from 'react-native'
import { INDENTS } from '../theme/themed'
import { type ThemeColors } from '../theme/types'

export const createSliderStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    flexFill: { flex: 1 },
    slider: { maxWidth: '100%' },
    title: {
      color: theme.text,
      fontWeight: 'bold',
      paddingBottom: INDENTS.middle,
      paddingLeft: INDENTS.lowest,
    },
  })
