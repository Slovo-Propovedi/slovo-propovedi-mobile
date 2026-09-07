import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const updateDialogStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: INDENTS.high,
  },
  buttons: {
    flexDirection: 'row',
    gap: INDENTS.medium,
  },
  dialog: {
    borderRadius: RADIUSES.middle,
    padding: INDENTS.high,
  },
  link: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginTop: INDENTS.medium,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  message: {
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
    marginBottom: INDENTS.high,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: INDENTS.medium,
  },
})
