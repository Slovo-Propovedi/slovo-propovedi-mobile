import { StyleSheet } from 'react-native'
import { APP_MAX_CONTENT_WIDTH } from 'shared/ui/layout'
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
    // Desktop-web: cap to the shared centered column; undefined on native.
    alignSelf: 'center',
    borderRadius: RADIUSES.middle,
    maxWidth: APP_MAX_CONTENT_WIDTH,
    padding: INDENTS.high,
    width: '100%',
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
