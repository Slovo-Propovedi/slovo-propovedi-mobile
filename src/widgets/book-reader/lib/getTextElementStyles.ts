import { type StyleProp, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import type { XMLElementName } from 'entities/book-reader';
import { BodyXMLElementName } from 'entities/book-reader';
import { FONT_SIZES, INDENTS } from 'shared';

interface GetTextElementStylesReturnType {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
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
  })[name as BodyXMLElementName];

const styles = StyleSheet.create({
  emphasisText: { fontStyle: 'italic' },

  paragraph: {
    marginVertical: INDENTS.lowest,
  },
  paragraphText: {
    fontSize: FONT_SIZES.h4,
  },

  strongText: { fontWeight: 'bold' },

  subtitle: {
    marginVertical: INDENTS.low,
  },
  subtitleText: { fontSize: FONT_SIZES.h2 },

  title: {
    marginVertical: INDENTS.middle,
  },
  titleText: { fontSize: FONT_SIZES.h1 },
});
