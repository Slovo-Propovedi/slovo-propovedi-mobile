import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  coverPreview: {
    borderRadius: RADIUSES.low,
    height: 140,
    marginBottom: INDENTS.medium,
    width: '100%',
  },
  // Иконки загрузки/библиотеки внутри строки URL-поля, справа от карандаша.
  fieldActions: {
    flexDirection: 'row',
    gap: INDENTS.lowest,
  },
  gridCell: {
    aspectRatio: 1,
    borderRadius: RADIUSES.low,
    overflow: 'hidden',
    width: '31%',
  },
  gridImage: {
    height: '100%',
    width: '100%',
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
  },
  libraryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: INDENTS.medium,
    paddingRight: INDENTS.low,
  },
  libraryItem: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  libraryList: {
    flexGrow: 0,
    padding: INDENTS.medium,
  },
  libraryRow: {
    gap: INDENTS.low,
  },
  modalTitle: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    paddingVertical: INDENTS.medium,
  },
  progressFill: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUSES.low,
    height: '100%',
  },
  progressTrack: {
    borderRadius: RADIUSES.low,
    height: 6,
    marginTop: INDENTS.low,
    overflow: 'hidden',
    width: '100%',
  },
  searchInput: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    fontSize: FONT_SIZES.base,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  state: {
    alignItems: 'center',
    paddingVertical: INDENTS.medium,
  },
})
