import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/themed'

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
  container: {
    borderBottomColor: COLORS.disabled,
    borderBottomWidth: 1,
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.high,
  },
  current: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.low,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: FONT_SIZES.base,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  label: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginBottom: INDENTS.low,
  },
  resetLink: {
    alignSelf: 'flex-start',
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.medium,
    textDecorationLine: 'underline',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
})
