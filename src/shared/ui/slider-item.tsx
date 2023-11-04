import React from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { IMAGE_PLACEHOLDER } from 'shared/images';
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/themed';
import type { RequireAtLeastOne } from 'shared/types';

const { height: windowHeight, width: windowWidth } = Dimensions.get('window');

export enum SliderItemSize {
  Large = 'large',
  Middle = 'middle',
  Small = 'small',
}

export type DisplayingTitleInSlide = RequireAtLeastOne<{
  isSlideTitleOnSlide: boolean;
  isSlideTitleUnderSlide: boolean;
}>;

export type SliderItemProps = {
  description?: string;
  displayingTitleInSlide: DisplayingTitleInSlide;
  isShort?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  previewURL: string;
  size?: SliderItemSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const componentLargeSize = windowWidth > windowHeight ? windowHeight - 50 : windowWidth - 50;
const componentMiddleSize = 250;
const componentSmallSize = 150;

export const SliderItem = ({
  description,
  displayingTitleInSlide: { isSlideTitleOnSlide, isSlideTitleUnderSlide },
  isShort,
  onPress,
  previewURL,
  size = SliderItemSize.Small,
  style,
  testID,
}: SliderItemProps) => {
  if (!previewURL) {
    return null;
  }

  const conditionSize = {
    [SliderItemSize.Large]: componentLargeSize,
    [SliderItemSize.Middle]: componentMiddleSize,
    [SliderItemSize.Small]: componentSmallSize,
  }[size];

  const descriptionTextSize =
    isShort && size !== SliderItemSize.Large ? FONT_SIZES.h4 : FONT_SIZES.h3;

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
          {isSlideTitleOnSlide && description && (
            <View style={styles.descriptionOnSlide} testID='slider-item-description-on-slide'>
              <Text
                numberOfLines={1}
                style={[
                  styles.descriptionText,
                  { fontSize: descriptionTextSize * 2, fontWeight: 'bold' },
                ]}
                testID='slider-item-description-text'
              >
                {description}
              </Text>
            </View>
          )}
        </ImageBackground>
        {isSlideTitleUnderSlide && description && (
          <View style={styles.description} testID='slider-item-description'>
            <Text
              numberOfLines={1}
              style={[styles.descriptionText, { fontSize: descriptionTextSize }]}
              testID='slider-item-description-text'
            >
              {description}
            </Text>
          </View>
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
  description: {
    padding: INDENTS.middle,
  },
  descriptionOnSlide: {
    padding: INDENTS.middle,
  },
  descriptionText: {
    color: COLORS.black,
  },
  imageBackgroundComponent: { justifyContent: 'flex-end', width: '100%' },
});
