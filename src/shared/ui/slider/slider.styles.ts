import { StyleSheet } from 'react-native'
import { INDENTS } from '../theme/themed'
import { type ThemeColors } from '../theme/types'
import { SLIDER_REST_INSET, SLIDER_STACK_GAP } from './slider-layout.lib'

export const createSliderStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    flexFill: { flex: 1 },
    slider: { maxWidth: '100%' },
    // Half of the stack gap above and below every slider, so two neighbouring
    // sliders are separated by exactly one title line.
    stackSpacing: {
      marginBottom: SLIDER_STACK_GAP / 2,
      marginTop: SLIDER_STACK_GAP / 2,
    },
    title: {
      color: theme.text,
      fontWeight: 'normal',
      paddingBottom: INDENTS.middle,
      paddingLeft: SLIDER_REST_INSET,
    },
  })
