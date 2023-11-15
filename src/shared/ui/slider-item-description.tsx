import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, INDENTS } from 'shared/themed';

export type SliderItemDescriptionTextAlign = 'auto' | 'center' | 'justify' | 'left' | 'right';

export enum SliderItemDescriptionBackgroundStyle {
  Dark = 'dark',
  DarkBlur = 'darkBlur',
  Transparent = 'transparent',
}

interface SliderItemDescriptionProps {
  backgroundStyle?: SliderItemDescriptionBackgroundStyle;
  isTitleLarge?: boolean;
  style?: StyleProp<ViewStyle>;
  subTitle?: string;
  subTitleTextAlign?: SliderItemDescriptionTextAlign;
  testID?: string;
  title: string;
  titleStyle?: StyleProp<TextStyle>;
  titleTextAlign?: SliderItemDescriptionTextAlign;
}

export const SliderItemDescription = ({
  backgroundStyle = SliderItemDescriptionBackgroundStyle.Transparent,
  isTitleLarge,
  style,
  subTitle,
  subTitleTextAlign = 'left',
  testID,
  title,
  titleStyle,
  titleTextAlign = 'left',
}: SliderItemDescriptionProps) => {
  if (!title) {
    return null;
  }

  const isDarkBackground = backgroundStyle === SliderItemDescriptionBackgroundStyle.Dark;
  const isDarkBlurBackground = backgroundStyle === SliderItemDescriptionBackgroundStyle.DarkBlur;

  return (
    <View
      style={[
        styles.component,
        isDarkBackground && styles.darkBackground,
        isDarkBlurBackground && styles.blurBackground,
        style,
      ]}
      testID={testID}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.title,
          (isDarkBackground || isDarkBlurBackground) && styles.titleColorOnDark,
          isTitleLarge && styles.titleLarge,
          { textAlign: titleTextAlign },
          titleStyle,
        ]}
        testID='slider-item-description-title'
      >
        {title}
      </Text>
      {subTitle && (
        <Text
          numberOfLines={2}
          style={[
            styles.subTitle,
            (isDarkBackground || isDarkBlurBackground) && styles.subTitleColorOnDark,
            { textAlign: subTitleTextAlign },
            titleStyle,
          ]}
          testID='slider-item-description-sub-title'
        >
          {subTitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  blurBackground: { backgroundColor: COLORS.black70 },

  component: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: INDENTS.middle,
  },

  darkBackground: { backgroundColor: COLORS.black },

  subTitle: {
    color: COLORS.disabled,
    fontSize: FONT_SIZES.h3,
  },
  subTitleColorOnDark: {
    color: COLORS.white,
  },

  title: {
    color: COLORS.black,
    fontSize: FONT_SIZES.h3,
  },
  titleColorOnDark: {
    color: COLORS.white,
  },
  titleLarge: { fontSize: FONT_SIZES.h3 * 2, fontWeight: 'bold' },
});
