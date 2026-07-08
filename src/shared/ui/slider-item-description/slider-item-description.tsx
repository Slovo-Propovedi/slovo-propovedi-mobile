import { StyleSheet, Text, View } from 'react-native'
import { type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, useTheme } from '../themed'
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
  const { currentTheme } = useTheme()
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
          isTitleLarge && styles.titleLarge,
          { color: isDarkBackground || isDarkBlurBackground ? COLORS.white : currentTheme.text },
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
            {
              color:
                isDarkBackground || isDarkBlurBackground ? COLORS.white : currentTheme.textMuted,
            },
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
    fontSize: FONT_SIZES.h3,
  },

  title: {
    fontSize: FONT_SIZES.h3,
  },
  titleLarge: { fontSize: FONT_SIZES.h3 * 2, fontWeight: 'bold' },
})
