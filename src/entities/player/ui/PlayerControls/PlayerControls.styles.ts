import { StyleSheet } from 'react-native'
import { FONT_SIZES } from 'shared/ui/theme'

export const playerControlsStyles = StyleSheet.create({
  bufferingText: {
    alignItems: 'center',
    fontSize: FONT_SIZES.h5,
  },
  controlsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
})
