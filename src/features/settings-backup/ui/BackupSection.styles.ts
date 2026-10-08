import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  action: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: INDENTS.low,
    marginTop: INDENTS.medium,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
  },
  autosyncLabel: {
    flex: 1,
    fontSize: FONT_SIZES.base,
  },
  autosyncRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: INDENTS.medium,
  },
})
