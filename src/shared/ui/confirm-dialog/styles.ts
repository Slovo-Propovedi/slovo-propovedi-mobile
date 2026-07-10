import { Platform, StatusBar, StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from '../themed'

const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0

export const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: INDENTS.high,
    paddingTop: statusBarHeight,
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
    justifyContent: 'center',
  },
  buttons: {
    flexDirection: 'row',
    flexShrink: 0,
    gap: INDENTS.medium,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: COLORS.disabled,
    borderRadius: RADIUSES.low,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: INDENTS.middle,
  },
  cancelButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
  confirmButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: INDENTS.middle,
  },
  confirmButtonText: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dialog: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUSES.middle,
    maxHeight: '85%',
    overflow: 'hidden',
    padding: INDENTS.high,
  },
  iconContainer: { marginBottom: INDENTS.medium },
  message: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
    marginBottom: INDENTS.high,
  },
  messageScroll: {
    flexShrink: 1,
    marginBottom: INDENTS.medium,
    width: '100%',
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: INDENTS.medium,
  },
})
