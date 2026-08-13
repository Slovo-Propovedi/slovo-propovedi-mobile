import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'

export const expandedDescriptionStyles = StyleSheet.create({
  descriptionCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderRadius: RADIUSES.middle,
    flex: 1,
    marginVertical: INDENTS.medium,
    padding: INDENTS.medium,
  },

  descriptionCloseButton: {
    position: 'absolute',
    right: INDENTS.low,
    top: INDENTS.low,
  },

  descriptionCloseIcon: {
    color: '#9ca3af',
    fontSize: FONT_SIZES.xl,
  },

  descriptionContainer: {
    flex: 1,
    marginHorizontal: INDENTS.medium,
    position: 'relative',
  },
})
