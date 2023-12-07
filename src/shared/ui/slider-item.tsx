import React from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from 'shared/constants';
import { IMAGE_PLACEHOLDER } from 'shared/images';
import { RADIUSES } from 'shared/themed';
import type {
  SliderItemDescriptionBackgroundStyle,
  SliderItemDescriptionTextAlign,
} from './slider-item-description';
import { SliderItemDescription } from './slider-item-description';

export enum SliderItemSize {
  Large = 'large',
  Middle = 'middle',
  Small = 'small',
  XLarge = 'xLarge',
}

export enum WhereIsSlideTitleLocated {
  BothOnAndUnder = 'bothOnAndUnder',
  On = 'on',
  Under = 'under',
}

export enum SliderItemTransform {
  High = 'high',
  Short = 'short',
}

export type SliderItemProps = {
  descriptionBackgroundStyle?: SliderItemDescriptionBackgroundStyle;
  descriptionSubTitle?: string;
  descriptionSubTitleTextAlign?: SliderItemDescriptionTextAlign;
  descriptionTitle?: string;
  descriptionTitleTextAlign?: SliderItemDescriptionTextAlign;
  isDescriptionTitleOnSlideLarge?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  previewURL: string;
  size?: SliderItemSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  transform?: SliderItemTransform;
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated;
};

const componentXLargeSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.9;
const componentLargeSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.62;
const componentMiddleSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.44;
const componentSmallSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.285;

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
  if (!previewURL) {
    return null;
  }

  const conditionSize = {
    [SliderItemSize.Large]: componentLargeSize,
    [SliderItemSize.Middle]: componentMiddleSize,
    [SliderItemSize.Small]: componentSmallSize,
    [SliderItemSize.XLarge]: componentXLargeSize,
  }[size];

  const isVisibleDescriptionOnSlide =
    (whereIsSlideTitleLocated === WhereIsSlideTitleLocated.On ||
      whereIsSlideTitleLocated === WhereIsSlideTitleLocated.BothOnAndUnder) &&
    descriptionTitle;
  const isVisibleDescriptionUnderSlide =
    (whereIsSlideTitleLocated === WhereIsSlideTitleLocated.Under ||
      whereIsSlideTitleLocated === WhereIsSlideTitleLocated.BothOnAndUnder) &&
    descriptionTitle;

  const imageHeight =
    (transform &&
      {
        [SliderItemTransform.High]: conditionSize * 1.3,
        [SliderItemTransform.Short]: conditionSize / 2,
      }[transform]) ||
    conditionSize;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} testID={testID}>
      <View style={[styles.component, { width: conditionSize }, style]}>
        <ImageBackground
          imageStyle={[styles.backgroundImage]}
          source={{ uri: previewURL || IMAGE_PLACEHOLDER }}
          style={[styles.imageBackgroundComponent, { height: imageHeight }]}
        >
          {isVisibleDescriptionOnSlide && (
            <SliderItemDescription
              backgroundStyle={descriptionBackgroundStyle}
              isTitleLarge={isDescriptionTitleOnSlideLarge}
              subTitle={descriptionSubTitle}
              subTitleTextAlign={descriptionSubTitleTextAlign}
              testID='slider-item-description-on-slide'
              title={descriptionTitle}
              titleTextAlign={descriptionTitleTextAlign}
            />
          )}
        </ImageBackground>
        {isVisibleDescriptionUnderSlide && (
          <SliderItemDescription
            backgroundStyle={descriptionBackgroundStyle}
            subTitle={descriptionSubTitle}
            subTitleTextAlign={descriptionSubTitleTextAlign}
            testID='slider-item-description-under-slide'
            title={descriptionTitle}
            titleTextAlign={descriptionTitleTextAlign}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    borderRadius: RADIUSES.large,
    resizeMode: 'cover',
  },
  component: {
    borderRadius: RADIUSES.large,
    minHeight: 50,
    minWidth: 50,
  },

  imageBackgroundComponent: { justifyContent: 'flex-end', width: '100%' },
});
