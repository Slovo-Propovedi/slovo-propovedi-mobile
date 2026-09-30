import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  artwork: {
    backgroundColor: COLORS.disabled,
    borderRadius: RADIUSES.low,
    height: 56,
    width: 56,
  },
  block: {
    marginTop: INDENTS.medium,
  },
  blockTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: INDENTS.medium,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  coverPreview: {
    borderRadius: RADIUSES.low,
    height: 140,
    marginBottom: INDENTS.medium,
    width: '100%',
  },
  errorBanner: {
    borderRadius: RADIUSES.low,
    marginBottom: INDENTS.medium,
    padding: INDENTS.medium,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
  },
  formContent: {
    padding: INDENTS.medium,
    paddingBottom: INDENTS.highest,
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
  input: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    fontSize: FONT_SIZES.base,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    padding: INDENTS.medium,
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: INDENTS.medium,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
})
