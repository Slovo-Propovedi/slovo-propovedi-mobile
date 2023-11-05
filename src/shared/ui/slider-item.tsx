import React from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { Dimensions, ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IMAGE_PLACEHOLDER } from 'shared/images';
import { FONT_SIZES, RADIUSES } from 'shared/themed';
import { SliderItemDescription } from './slider-item-description';

const { height: windowHeight, width: windowWidth } = Dimensions.get('window');

export enum SliderItemSize {
  Large = 'large',
  Middle = 'middle',
  Small = 'small',
}

export enum WhereIsSlideTitleLocated {
  BothOnAndUnder = 'bothOnAndUnder',
  On = 'on',
  Under = 'under',
}

export type SliderItemProps = {
  descriptionTitle?: string;
  isShort?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  previewURL: string;
  size?: SliderItemSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated;
};

const componentLargeSize = windowWidth > windowHeight ? windowHeight - 50 : windowWidth - 50;
const componentMiddleSize = 250;
const componentSmallSize = 150;

export const SliderItem = ({
  descriptionTitle,
  isShort,
  onPress,
  previewURL,
  size = SliderItemSize.Small,
  style,
  testID,
  whereIsSlideTitleLocated = WhereIsSlideTitleLocated.Under,
}: SliderItemProps) => {
  if (!previewURL) {
    return null;
  }

  const conditionSize = {
    [SliderItemSize.Large]: componentLargeSize,
    [SliderItemSize.Middle]: componentMiddleSize,
    [SliderItemSize.Small]: componentSmallSize,
  }[size];

  const isVisibleDescriptionOnSlide =
    (whereIsSlideTitleLocated === WhereIsSlideTitleLocated.On ||
      whereIsSlideTitleLocated === WhereIsSlideTitleLocated.BothOnAndUnder) &&
    descriptionTitle;
  const isVisibleDescriptionUnderSlide =
    (whereIsSlideTitleLocated === WhereIsSlideTitleLocated.Under ||
      whereIsSlideTitleLocated === WhereIsSlideTitleLocated.BothOnAndUnder) &&
    descriptionTitle;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} testID={testID}>
      <View style={[styles.component, { width: conditionSize }, style]}>
        <ImageBackground
          imageStyle={[styles.backgroundImage]}
          source={{ uri: previewURL || IMAGE_PLACEHOLDER }}
          style={[
            styles.imageBackgroundComponent,
            { height: isShort ? conditionSize / 2 : conditionSize },
          ]}
        >
          {isVisibleDescriptionOnSlide && (
            <SliderItemDescription
              testID='slider-item-description-on-slide'
              title={descriptionTitle}
              titleStyle={{ fontSize: FONT_SIZES.h3 * 2, fontWeight: 'bold' }}
            />
          )}
        </ImageBackground>
        {isVisibleDescriptionUnderSlide && (
          <SliderItemDescription
            testID='slider-item-description-under-slide'
            title={descriptionTitle}
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
