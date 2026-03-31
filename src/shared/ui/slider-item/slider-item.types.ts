import type {
  SliderItemDescriptionBackgroundStyle,
  SliderItemDescriptionTextAlign,
} from '../slider-item-description/slider-item-description.types'
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'

export enum SliderItemSize {
  Large = 'large',
  Middle = 'middle',
  Small = 'small',
  XLarge = 'xLarge',
}

export enum SliderItemTransform {
  High = 'high',
  Short = 'short',
}

export enum WhereIsSlideTitleLocated {
  BothOnAndUnder = 'bothOnAndUnder',
  On = 'on',
  Under = 'under',
}

export interface SliderItemProps {
  artwork: string | undefined
  descriptionBackgroundStyle?: SliderItemDescriptionBackgroundStyle
  descriptionSubTitle?: string
  descriptionSubTitleTextAlign?: SliderItemDescriptionTextAlign
  descriptionTitle?: string
  descriptionTitleTextAlign?: SliderItemDescriptionTextAlign
  isDescriptionTitleOnSlideLarge?: boolean
  onPress?: (event: GestureResponderEvent) => void
  size?: SliderItemSize
  style?: StyleProp<ViewStyle>
  testID?: string
  transform?: SliderItemTransform
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated
}
