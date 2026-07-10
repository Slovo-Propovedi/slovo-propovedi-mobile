import { type StyleProp, StyleSheet, type TextStyle, type ViewStyle } from 'react-native'
import { type ThemeColors } from 'shared/ui/theme'
import { FONT_SIZES, INDENTS } from 'shared/ui/themed'
import type { XMLElementName } from '../model'
import { BodyXMLElementName } from '../model'

interface GetTextElementStylesReturnType {
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export const getTextElementStyles = (
  name: XMLElementName,
  theme: ThemeColors,
): GetTextElementStylesReturnType =>
  ({
    [BodyXMLElementName.Body]: {},
    [BodyXMLElementName.Emphasis]: { textStyle: createStyles(theme).emphasisText },
    [BodyXMLElementName.P]: {
      style: createStyles(theme).paragraph,
      textStyle: createStyles(theme).paragraphText,
    },
    [BodyXMLElementName.Section]: {},
    [BodyXMLElementName.Strong]: { textStyle: createStyles(theme).strongText },
    [BodyXMLElementName.Subtitle]: {
      style: createStyles(theme).subtitle,
      textStyle: createStyles(theme).subtitleText,
    },
    [BodyXMLElementName.Title]: {
      style: createStyles(theme).title,
      textStyle: createStyles(theme).titleText,
    },
  })[name as BodyXMLElementName]

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    emphasisText: { color: theme.text, fontStyle: 'italic' },

    paragraph: {
      marginVertical: INDENTS.lowest,
    },
    paragraphText: {
      color: theme.text,
      fontSize: FONT_SIZES.h4,
    },

    strongText: { color: theme.text, fontWeight: 'bold' },

    subtitle: {
      marginVertical: INDENTS.low,
    },
    subtitleText: { color: theme.text, fontSize: FONT_SIZES.h2 },

    title: {
      marginVertical: INDENTS.middle,
    },
    titleText: { color: theme.text, fontSize: FONT_SIZES.h1 },
  })
