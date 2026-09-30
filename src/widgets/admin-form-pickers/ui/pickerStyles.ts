import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

// Стили поисковых пикеров формы (плейлисты): строка с чекбоксом и подписью.
export const pickerStyles = StyleSheet.create({
  checkbox: {
    borderRadius: RADIUSES.low,
    height: 22,
    width: 22,
  },
  list: {
    marginTop: INDENTS.low,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
  rowBody: {
    flex: 1,
  },
  rowMeta: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  rowTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
})
