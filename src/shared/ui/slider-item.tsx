import React from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS, FONT_SIZES, RADIUSES } from 'shared/themed';
import { TouchableImageBackground } from 'shared/ui/touchable-image-background';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

export enum SliderItemSize {
  Small = 'small',
  Middle = 'middle',
  Large = 'large',
}

export interface SliderItemProps {
  style?: StyleProp<ViewStyle>;
  previewURL: string;
  description?: string;
  size?: SliderItemSize;
  onPress?: (event: GestureResponderEvent) => void;
  testID?: string;
}

export const SliderItem = ({
  style,
  previewURL,
  description,
  size = SliderItemSize.Small,
  onPress,
  testID,
}: SliderItemProps) => {
  if (!previewURL) {
    return null;
  }

  return (
    <TouchableImageBackground
      testID={testID}
      style={[
        styles.component,
        {
          [SliderItemSize.Small]: styles.componentSmall,
          [SliderItemSize.Middle]: styles.componentMiddle,
          [SliderItemSize.Large]: styles.componentLarge,
        }[size],
        style,
      ]}
      imageStyle={styles.image}
      previewSrc={previewURL}
      onPress={onPress}
    >
      {description && (
        <View style={styles.description} testID='slider-item-description'>
          <Text style={styles.descriptionText} testID='slider-item-description-text'>
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
    justifyContent: 'flex-end',
    borderRadius: RADIUSES.large,
  },
  componentSmall: {
    width: 150,
    height: 150,
  },
  componentMiddle: { width: 250, height: 250 },
  componentLarge: {
    width: componentLargeSize,
    height: componentLargeSize,
  },
  image: {
    borderRadius: RADIUSES.large,
  },

  description: {
    padding: 10,
    backgroundColor: COLORS.black,
    opacity: 0.7,
    maxHeight: '30%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  descriptionText: {
    fontSize: FONT_SIZES.h3,
    color: 'white',
  },
});
