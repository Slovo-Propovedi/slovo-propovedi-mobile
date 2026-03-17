import { type StyleProp, StyleSheet, type TextStyle, type ViewStyle } from 'react-native'
import { BodyXMLElementName } from 'entities/book-reader'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/themed'
import type { XMLElementName } from 'entities/book-reader'

interface GetTextElementStylesReturnType {
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export const getTextElementStyles = (name: XMLElementName): GetTextElementStylesReturnType =>
  ({
    [BodyXMLElementName.Body]: {},
    [BodyXMLElementName.Emphasis]: { textStyle: styles.emphasisText },
    [BodyXMLElementName.P]: {
      style: styles.paragraph,
      textStyle: styles.paragraphText,
    },
    [BodyXMLElementName.Section]: {},
    [BodyXMLElementName.Strong]: { textStyle: styles.strongText },
    [BodyXMLElementName.Subtitle]: { style: styles.subtitle, textStyle: styles.subtitleText },
    [BodyXMLElementName.Title]: { style: styles.title, textStyle: styles.titleText },
  })[name as BodyXMLElementName]

const styles = StyleSheet.create({
  emphasisText: { color: COLORS.text, fontStyle: 'italic' },

  paragraph: {
    marginVertical: INDENTS.lowest,
  },
  paragraphText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h4,
  },

  strongText: { color: COLORS.text, fontWeight: 'bold' },

  subtitle: {
    marginVertical: INDENTS.low,
  },
  subtitleText: { color: COLORS.text, fontSize: FONT_SIZES.h2 },

  title: {
    marginVertical: INDENTS.middle,
  },
  titleText: { color: COLORS.text, fontSize: FONT_SIZES.h1 },
})
