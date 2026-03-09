import React from 'react'
import { ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from 'shared/constants'
import { IMAGE_PLACEHOLDER } from 'shared/images'
import { RADIUSES } from 'shared/themed'
import { SliderItemDescription } from '../slider-item-description/slider-item-description'
import {
  type SliderItemProps,
  SliderItemSize,
  SliderItemTransform,
  WhereIsSlideTitleLocated,
} from './slider-item.types'

const componentXLargeSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.9
const componentLargeSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.62
const componentMiddleSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.44
const componentSmallSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.285

export const SliderItem = ({
  descriptionBackgroundStyle,
  descriptionSubTitle,
  descriptionSubTitleTextAlign,
  descriptionTitle,
  descriptionTitleTextAlign,
  isDescriptionTitleOnSlideLarge,
  onPress,
  previewURL,
  size = SliderItemSize.Small,
  style,
  testID,
  transform,
  whereIsSlideTitleLocated = WhereIsSlideTitleLocated.Under,
}: SliderItemProps) => {
  if (!previewURL) return null

  const conditionSize = {
    [SliderItemSize.Large]: componentLargeSize,
    [SliderItemSize.Middle]: componentMiddleSize,
    [SliderItemSize.Small]: componentSmallSize,
    [SliderItemSize.XLarge]: componentXLargeSize,
  }[size]

  const isVisibleDescriptionOnSlide =
    (whereIsSlideTitleLocated === WhereIsSlideTitleLocated.On ||
      whereIsSlideTitleLocated === WhereIsSlideTitleLocated.BothOnAndUnder) &&
    descriptionTitle
  const isVisibleDescriptionUnderSlide =
    (whereIsSlideTitleLocated === WhereIsSlideTitleLocated.Under ||
      whereIsSlideTitleLocated === WhereIsSlideTitleLocated.BothOnAndUnder) &&
    descriptionTitle

  const imageHeight =
    (transform &&
      {
        [SliderItemTransform.High]: conditionSize * 1.3,
        [SliderItemTransform.Short]: conditionSize / 2,
      }[transform]) ||
    conditionSize

  return (
    <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.component, { width: conditionSize }, style]}>
        <ImageBackground
          resizeMode='cover'
          imageStyle={[styles.backgroundImage]}
          source={{ uri: previewURL || IMAGE_PLACEHOLDER }}
          style={[styles.imageBackgroundComponent, { height: imageHeight }]}
        >
          {isVisibleDescriptionOnSlide && (
            <SliderItemDescription
              title={descriptionTitle}
              subTitle={descriptionSubTitle}
              testID='slider-item-description-on-slide'
              titleTextAlign={descriptionTitleTextAlign}
              backgroundStyle={descriptionBackgroundStyle}
              isTitleLarge={isDescriptionTitleOnSlideLarge}
              subTitleTextAlign={descriptionSubTitleTextAlign}
            />
          )}
        </ImageBackground>
        {isVisibleDescriptionUnderSlide && (
          <SliderItemDescription
            title={descriptionTitle}
            subTitle={descriptionSubTitle}
            titleTextAlign={descriptionTitleTextAlign}
            backgroundStyle={descriptionBackgroundStyle}
            testID='slider-item-description-under-slide'
            subTitleTextAlign={descriptionSubTitleTextAlign}
          />
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  backgroundImage: { borderRadius: RADIUSES.large },
  component: { borderRadius: RADIUSES.large, minHeight: 50, minWidth: 50 },
  imageBackgroundComponent: { justifyContent: 'flex-end', width: '100%' },
})
