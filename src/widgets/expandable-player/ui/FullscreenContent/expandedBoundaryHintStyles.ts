import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const expandedBoundaryHintStyles = StyleSheet.create({
  boundaryHint: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: RADIUSES.round,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },

  boundaryHintAnchor: {
    alignItems: 'center',
    bottom: '100%',
    left: 0,
    marginBottom: INDENTS.low,
    position: 'absolute',
    right: 0,
  },

  boundaryHintText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
  },
})
