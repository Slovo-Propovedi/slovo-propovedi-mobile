import { StyleSheet } from 'react-native'
import { INDENTS } from '../theme/themed'
import { type ThemeColors } from '../theme/types'
import { SLIDER_REST_INSET } from './slider-layout.lib'

export const createSliderStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    flexFill: { flex: 1 },
    slider: { maxWidth: '100%' },
    title: {
      color: theme.text,
      fontWeight: 'normal',
      paddingBottom: INDENTS.middle,
      paddingLeft: SLIDER_REST_INSET,
    },
  })
