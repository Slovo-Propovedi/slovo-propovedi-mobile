import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.middle,
  },
  buttons: {
    flexDirection: 'row',
    gap: INDENTS.low,
    marginTop: INDENTS.medium,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: FONT_SIZES.base,
    marginTop: INDENTS.low,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  resetLink: {
    alignSelf: 'flex-start',
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.medium,
    textDecorationLine: 'underline',
  },
})
