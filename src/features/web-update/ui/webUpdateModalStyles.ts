import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const webUpdateModalStyles = StyleSheet.create({
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
  disabledButton: {
    opacity: 0.5,
  },
  message: {
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
    marginBottom: INDENTS.high,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: INDENTS.middle,
  },
  primaryButtonText: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: COLORS.disabled,
    borderRadius: RADIUSES.low,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: INDENTS.middle,
  },
  secondaryButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: INDENTS.medium,
  },
})
