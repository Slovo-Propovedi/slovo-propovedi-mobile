import {
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'
import { COLORS } from '../../theme/colors'
import { useTheme } from '../../theme/ThemeContext/useTheme'
import { FONT_SIZES, INDENTS, RADIUSES } from '../../theme/themed'
import { SliderItemTextSkeleton } from './skeleton'
import { type SliderItemTextAlign, SliderItemTextBackgroundStyle } from './slider-item-text.types'
import { getTitleTextShadow } from './titleTextShadow'

// Текст карточки: статичный заголовок (число строк ограничено `maxLines`, по
// умолчанию одна; конец обрезается троеточием) и необязательный подзаголовок.
// Пустой заголовок не рендерит ничего — подзаголовок сам по себе не показывается.
export const SliderItemText = ({
  backgroundStyle = SliderItemTextBackgroundStyle.Transparent,
  borderRadius,
  isOnArtwork = false,
  maxLines = 1,
  style,
  subTitle,
  subTitleTextAlign = 'left',
  title,
  titleFontSize = FONT_SIZES.md,
  titleStyle,
  titleTextAlign = 'left',
}: {
  backgroundStyle?: SliderItemTextBackgroundStyle
  borderRadius?: boolean
  isOnArtwork?: boolean
  maxLines?: number
  style?: StyleProp<ViewStyle>
  subTitle?: string
  subTitleTextAlign?: SliderItemTextAlign
  title: string
  titleFontSize?: number
  titleStyle?: StyleProp<TextStyle>
  titleTextAlign?: SliderItemTextAlign
}) => {
  const { currentTheme } = useTheme()
  if (!title) return null

  const isDarkBackground = backgroundStyle === SliderItemTextBackgroundStyle.Dark
  const isDarkBlurBackground = backgroundStyle === SliderItemTextBackgroundStyle.DarkBlur
  const isOnPlate = isDarkBackground || isDarkBlurBackground
  const textColor = isOnPlate ? COLORS.white : currentTheme.text
  const isRounded = borderRadius ?? true

  return (
    <View
      style={[
        styles.component,
        {
          borderBottomLeftRadius: isRounded ? RADIUSES.slider : 0,
          borderBottomRightRadius: isRounded ? RADIUSES.slider : 0,
        },
        isDarkBackground && styles.darkBackground,
        isDarkBlurBackground && styles.blurBackground,
        style,
      ]}
    >
      <Text
        ellipsizeMode='tail'
        numberOfLines={maxLines}
        style={[
          { fontSize: titleFontSize },
          { color: textColor },
          { textAlign: titleTextAlign },
          isOnArtwork && !isOnPlate && getTitleTextShadow(textColor),
          styles.titleBold,
          titleStyle,
        ]}
      >
        {title}
      </Text>
      {subTitle ? (
        <Text
          numberOfLines={2}
          style={[
            styles.subTitle,
            {
              color: isOnPlate ? COLORS.white : currentTheme.textMuted,
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
    fontSize: FONT_SIZES.base,
  },

  titleBold: { fontWeight: 'bold' },
})
