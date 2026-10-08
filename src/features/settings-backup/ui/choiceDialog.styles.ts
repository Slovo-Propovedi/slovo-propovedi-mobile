import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/theme'

// Общие стили диалогов выбора действия резервной копии (режим импорта и
// конфликт автосинхронизации).
export const choiceDialogStyles = StyleSheet.create({
  choice: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  choiceText: {
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
  },
  container: {
    padding: INDENTS.high,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.low,
  },
  primaryText: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: INDENTS.low,
  },
})
