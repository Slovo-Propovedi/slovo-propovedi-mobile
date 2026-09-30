import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS } from 'shared/ui/theme'

// Стили поискового списка плейлистов (PlaylistPicker и его строки).
export const pickerStyles = StyleSheet.create({
  pickerList: {
    marginTop: INDENTS.low,
  },
  pickerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
  pickerRowBody: {
    flex: 1,
  },
  pickerRowMeta: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  pickerRowTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
  pickerState: {
    alignItems: 'center',
    paddingVertical: INDENTS.medium,
  },
})
