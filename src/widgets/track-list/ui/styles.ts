import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'

export const queueControlsStyles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: RADIUSES.round,
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: INDENTS.middle,
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.middle,
  },
  buttonText: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginLeft: INDENTS.low,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: INDENTS.middle,
  },
  icon: {
    tintColor: COLORS.onPrimary,
  },
})
