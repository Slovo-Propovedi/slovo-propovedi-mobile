import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, MIN_TOUCH_TARGET, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
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
  gridList: {
    padding: INDENTS.medium,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
  },
  libraryButton: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: INDENTS.low,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: INDENTS.medium,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    padding: INDENTS.medium,
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
    justifyContent: 'center',
    marginTop: INDENTS.low,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: INDENTS.medium,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
})
