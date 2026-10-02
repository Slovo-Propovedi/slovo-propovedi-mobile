import {
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'
import { MarqueeText } from '../../marquee-text/marquee-text'
import { COLORS } from '../../theme/colors'
import { useTheme } from '../../theme/ThemeContext/useTheme'
import { FONT_SIZES, INDENTS, RADIUSES } from '../../theme/themed'
import { SliderItemTextSkeleton } from './skeleton'
import { type SliderItemTextAlign, SliderItemTextBackgroundStyle } from './slider-item-text.types'

// Текст карточки: заголовок (MarqueeText) и необязательный подзаголовок. Пустой
// заголовок не рендерит ничего — подзаголовок сам по себе не показывается.
export const SliderItemText = ({
  backgroundStyle = SliderItemTextBackgroundStyle.Transparent,
  borderRadius,
  style,
  subTitle,
  subTitleTextAlign = 'left',
  title,
  titleStyle,
  titleTextAlign = 'left',
}: {
  backgroundStyle?: SliderItemTextBackgroundStyle
  borderRadius?: boolean
  style?: StyleProp<ViewStyle>
  subTitle?: string
  subTitleTextAlign?: SliderItemTextAlign
  title: string
  titleStyle?: StyleProp<TextStyle>
  titleTextAlign?: SliderItemTextAlign
}) => {
  const { currentTheme } = useTheme()
  if (!title) return null

  const isDarkBackground = backgroundStyle === SliderItemTextBackgroundStyle.Dark
  const isDarkBlurBackground = backgroundStyle === SliderItemTextBackgroundStyle.DarkBlur
  const isRounded = borderRadius ?? true

  return (
    <View
      style={[
        styles.component,
        {
          borderBottomLeftRadius: isRounded ? RADIUSES.large : 0,
          borderBottomRightRadius: isRounded ? RADIUSES.large : 0,
        },
        isDarkBackground && styles.darkBackground,
        isDarkBlurBackground && styles.blurBackground,
        style,
      ]}
    >
      <MarqueeText
        text={title}
        textStyle={[
          styles.title,
          { color: isDarkBackground || isDarkBlurBackground ? COLORS.white : currentTheme.text },
          { textAlign: titleTextAlign },
          titleStyle,
        ]}
      />
      {subTitle ? (
        <Text
          numberOfLines={2}
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
      ) : null}
    </View>
  )
}

// Скелетон прикреплён к тексту как `SliderItemText.Skeleton` — составная часть
// скелетона карточки (`SliderItem.Skeleton`), а не самостоятельный компонент.
SliderItemText.Skeleton = SliderItemTextSkeleton

const styles = StyleSheet.create({
  blurBackground: { backgroundColor: COLORS.black70 },

  component: {
    overflow: 'hidden',
    padding: INDENTS.middle,
  },

  darkBackground: { backgroundColor: COLORS.black },

  subTitle: {
    fontSize: FONT_SIZES.h3,
  },

  title: {
    fontSize: FONT_SIZES.h3,
  },
})
