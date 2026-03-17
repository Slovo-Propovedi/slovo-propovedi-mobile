import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/themed'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'
import {
  SliderItemDescriptionBackgroundStyle,
  type SliderItemDescriptionTextAlign,
} from './slider-item-description.types'

interface SliderItemDescriptionProps {
  backgroundStyle?: SliderItemDescriptionBackgroundStyle
  isTitleLarge?: boolean
  style?: StyleProp<ViewStyle>
  subTitle?: string
  subTitleTextAlign?: SliderItemDescriptionTextAlign
  testID?: string
  title: string
  titleStyle?: StyleProp<TextStyle>
  titleTextAlign?: SliderItemDescriptionTextAlign
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
  if (!title) return null

  const isDarkBackground = backgroundStyle === SliderItemDescriptionBackgroundStyle.Dark
  const isDarkBlurBackground = backgroundStyle === SliderItemDescriptionBackgroundStyle.DarkBlur

  return (
    <View
      testID={testID}
      style={[
        styles.component,
        isDarkBackground && styles.darkBackground,
        isDarkBlurBackground && styles.blurBackground,
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        testID='slider-item-description-title'
        style={[
          styles.title,
          (isDarkBackground || isDarkBlurBackground) && styles.titleColorOnDark,
          isTitleLarge && styles.titleLarge,
          { textAlign: titleTextAlign },
          titleStyle,
        ]}
      >
        {title}
      </Text>
      {subTitle && (
        <Text
          numberOfLines={2}
          testID='slider-item-description-sub-title'
          style={[
            styles.subTitle,
            (isDarkBackground || isDarkBlurBackground) && styles.subTitleColorOnDark,
            { textAlign: subTitleTextAlign },
            titleStyle,
          ]}
        >
          {subTitle}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  blurBackground: { backgroundColor: COLORS.black70 },

  component: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: INDENTS.middle,
  },

  darkBackground: { backgroundColor: COLORS.black },

  subTitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.h3,
  },
  subTitleColorOnDark: {
    color: COLORS.white,
  },

  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h3,
  },
  titleColorOnDark: {
    color: COLORS.white,
  },
  titleLarge: { fontSize: FONT_SIZES.h3 * 2, fontWeight: 'bold' },
})
