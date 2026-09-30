import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, MIN_TOUCH_TARGET, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  // Строка действий «Выбрать из библиотеки» + «Загрузить …» в одну линию.
  actionsRow: {
    flexDirection: 'row',
    gap: INDENTS.low,
    marginTop: INDENTS.low,
  },
  coverPreview: {
    borderRadius: RADIUSES.low,
    height: 140,
    marginBottom: INDENTS.medium,
    width: '100%',
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
  libraryButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: INDENTS.low,
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: INDENTS.medium,
  },
  libraryButtonLabel: {
    fontSize: FONT_SIZES.sm,
  },
  libraryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: INDENTS.medium,
    paddingRight: INDENTS.low,
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
  uploadButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flex: 1,
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: INDENTS.medium,
  },
  uploadButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
})
