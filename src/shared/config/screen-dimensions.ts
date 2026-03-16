import { Dimensions } from 'react-native'

export const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')

export const SIZE_OF_MINIMUM_SIDE_OF_SCREEN =
  SCREEN_WIDTH > SCREEN_HEIGHT ? SCREEN_HEIGHT : SCREEN_WIDTH
