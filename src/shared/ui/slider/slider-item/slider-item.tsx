import { ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native'
import { match } from 'ts-pattern'
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from '../../../config/screen-dimensions'
import { IMAGE_PLACEHOLDER } from '../../images'
import { RADIUSES } from '../../themed'
import { SliderItemDescription } from '../slider-item-description/slider-item-description'
import { SliderItemSkeleton } from './skeleton'
import {
  type SliderItemProps,
  SliderItemSize,
  SliderItemTransform,
  WhereIsSlideTitleLocated,
} from './slider-item.types'

export const SliderItem = ({
  artwork,
  descriptionBackgroundStyle,
  descriptionSubTitle,
  descriptionSubTitleTextAlign,
  descriptionTitle,
  descriptionTitleTextAlign,
  isDescriptionTitleOnSlideLarge,
  onPress,
  size = SliderItemSize.Small,
  style,
  testID,
  transform,
  whereIsSlideTitleLocated = WhereIsSlideTitleLocated.Under,
}: SliderItemProps) => {
  const conditionSize = match(size)
    .with(SliderItemSize.Large, () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.62)
    .with(SliderItemSize.Middle, () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.44)
    .with(SliderItemSize.Small, () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.285)
    .with(SliderItemSize.XLarge, () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.9)
    .exhaustive()

  const isVisibleDescriptionOnSlide =
    (whereIsSlideTitleLocated === WhereIsSlideTitleLocated.On ||
      whereIsSlideTitleLocated === WhereIsSlideTitleLocated.BothOnAndUnder) &&
    descriptionTitle
  const isVisibleDescriptionUnderSlide =
    (whereIsSlideTitleLocated === WhereIsSlideTitleLocated.Under ||
      whereIsSlideTitleLocated === WhereIsSlideTitleLocated.BothOnAndUnder) &&
    descriptionTitle

  const imageHeight = match(transform)
    .with(SliderItemTransform.High, () => conditionSize * 1.3)
    .with(SliderItemTransform.Short, () => conditionSize / 2)
    .with(undefined, () => conditionSize)
    .exhaustive()

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole='button'
    >
      <View style={[styles.component, { width: conditionSize }, style]}>
        <ImageBackground
          resizeMode='cover'
          imageStyle={[styles.backgroundImage]}
          source={{ uri: artwork || IMAGE_PLACEHOLDER }}
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

SliderItem.Skeleton = SliderItemSkeleton

const styles = StyleSheet.create({
  backgroundImage: { borderRadius: RADIUSES.large },
  component: { borderRadius: RADIUSES.large, minHeight: 50, minWidth: 50 },
  imageBackgroundComponent: { justifyContent: 'flex-end', width: '100%' },
})
