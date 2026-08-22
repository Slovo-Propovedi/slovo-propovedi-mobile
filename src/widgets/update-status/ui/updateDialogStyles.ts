import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const updateDialogStyles = StyleSheet.create({
  backdrop: {
    backgroundColor: COLORS.black70,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: INDENTS.high,
  },
  buttons: {
    flexDirection: 'row',
    gap: INDENTS.medium,
  },
  dialog: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUSES.middle,
    padding: INDENTS.high,
  },
  link: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginTop: INDENTS.medium,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  message: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
    marginBottom: INDENTS.high,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: INDENTS.medium,
  },
})
