import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, MIN_TOUCH_TARGET } from '../theme/themed'

export const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: MIN_TOUCH_TARGET,
    paddingLeft: INDENTS.high,
    paddingRight: INDENTS.low,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZES.h1,
    fontWeight: '700',
  },
})
