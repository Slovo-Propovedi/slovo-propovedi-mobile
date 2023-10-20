import React from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/themed';
import { TouchableImageBackground } from 'shared/ui/touchable-image-background';

const { height: windowHeight, width: windowWidth } = Dimensions.get('window');

export enum SliderItemSize {
  Large = 'large',
  Middle = 'middle',
  Small = 'small',
}

export interface SliderItemProps {
  description?: string;
  isShort?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  previewURL: string;
  size?: SliderItemSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const SliderItem = ({
  description,
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

  const conditionStyle = {
    [SliderItemSize.Large]: styles.componentLarge,
    [SliderItemSize.Middle]: styles.componentMiddle,
    [SliderItemSize.Small]: styles.componentSmall,
  }[size];

  return (
    <TouchableImageBackground
      imageStyle={styles.image}
      onPress={onPress}
      previewSrc={previewURL}
      style={[
        styles.component,
        { ...conditionStyle, ...(isShort && { height: conditionStyle.height / 2 }) },
        style,
      ]}
      testID={testID}
    >
      {description && (
        <View style={styles.description} testID='slider-item-description'>
          <Text
            numberOfLines={1}
            style={[
              styles.descriptionText,
              { ...(isShort && size !== SliderItemSize.Large && { fontSize: FONT_SIZES.h4 }) },
            ]}
            testID='slider-item-description-text'
          >
            {description}
          </Text>
        </View>
      )}
    </TouchableImageBackground>
  );
};

const componentLargeSize = windowWidth > windowHeight ? windowHeight - 50 : windowWidth - 50;

const styles = StyleSheet.create({
  component: {
    borderRadius: RADIUSES.large,
    justifyContent: 'flex-end',
  },
  componentLarge: {
    height: componentLargeSize,
    width: componentLargeSize,
  },
  componentMiddle: { height: 250, width: 250 },
  componentSmall: {
    height: 150,
    width: 150,
  },
  description: {
    backgroundColor: COLORS.black,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    opacity: 0.7,
    padding: INDENTS.low,
  },

  descriptionText: {
    color: 'white',
    fontSize: FONT_SIZES.h3,
  },
  image: {
    borderRadius: RADIUSES.large,
  },
});
