import { type ReactNode } from 'react'
import { type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native'
import {
  type SliderItemTextAlign,
  type SliderItemTextBackgroundStyle,
} from '../slider-item-text/slider-item-text.types'

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
  On = 'on',
  Under = 'under',
}

export interface SliderItemProps {
  artwork: null | string | undefined
  /** Нода вместо обложки: рендерится поверх тематической подложки (иконка и т.п.). */
  artworkIcon?: ReactNode
  /** Радиус карточки; `undefined` трактуется как `true`. */
  borderRadius?: boolean
  /** Описание плейлиста на карточке; пустая строка не рендерится. */
  description?: string
  descriptionBackgroundStyle?: SliderItemTextBackgroundStyle
  isDescriptionTitleOnSlideLarge?: boolean
  onLongPress?: (event: GestureResponderEvent) => void
  onPress?: (event: GestureResponderEvent) => void
  size?: SliderItemSize
  style?: StyleProp<ViewStyle>
  testID?: string
  /** Заголовок карточки. */
  title?: string
  titleTextAlign?: SliderItemTextAlign
  transform?: SliderItemTransform
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated
}

export interface SliderItemsElement<D extends object> {
  artwork: null | string | undefined
  /** Нода вместо обложки (иконка и т.п.); при наличии обложка не рендерится. */
  artworkIcon?: ReactNode
  data: D
  /** Описание плейлиста: рендерится на карточке при включённом `isDescriptionTitleOnSlideLarge`. */
  description?: string
  /** Заголовок карточки. */
  title?: string
}
