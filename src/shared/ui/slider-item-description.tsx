import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, INDENTS } from 'shared/themed';

export const SliderItemDescription = ({
  style,
  subTitle,
  testID,
  title,
  titleStyle,
}: {
  style?: StyleProp<ViewStyle>;
  subTitle?: string;
  testID?: string;
  title: string;
  titleStyle?: StyleProp<TextStyle>;
}) => {
  if (!title) {
    return null;
  }

  return (
    <View style={[styles.component, style]} testID={testID}>
      <Text
        numberOfLines={1}
        style={[styles.title, titleStyle]}
        testID='slider-item-description-title'
      >
        {title}
      </Text>
      {subTitle && (
        <Text
          numberOfLines={2}
          style={[styles.subTitle, titleStyle]}
          testID='slider-item-description-sub-title'
        >
          {subTitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  component: {
    padding: INDENTS.middle,
  },

  subTitle: {
    color: COLORS.disabled,
    fontSize: FONT_SIZES.h3,
  },
  title: {
    color: COLORS.black,
    fontSize: FONT_SIZES.h3,
  },
});
