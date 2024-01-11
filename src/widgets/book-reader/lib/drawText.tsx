import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { BodyXMLElementName, XMLElementType } from 'entities/book-reader';
import type { XMLElement } from 'entities/book-reader';
import { FONT_SIZES, INDENTS } from 'shared';

interface DrawTextProps {
  element: XMLElement;
  expandedTextStyle?: StyleProp<TextStyle>;
  parentKey?: string;
}

export const drawText = ({
  element: { elements, name, text = '', type },
  expandedTextStyle,
  parentKey = '',
}: DrawTextProps): React.ReactNode => {
  if (type === XMLElementType.Text) {
    if (typeof text === 'string') text = text.replace(/((\n)|(\s))+/g, ' ');

    return text;
  }

  if (!elements?.length) return null;

  const { style, textStyle } = ((): {
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
  } => {
    if (name === BodyXMLElementName.P)
      return {
        style: styles.paragraph,
        textStyle: styles.paragraphText,
      };

    if (name === BodyXMLElementName.Subtitle)
      return { style: styles.subtitle, textStyle: styles.subtitleText };

    if (name === BodyXMLElementName.Title)
      return { style: styles.title, textStyle: styles.titleText };

    if (name === BodyXMLElementName.Emphasis) return { textStyle: styles.emphasisText };

    if (name === BodyXMLElementName.Strong) return { textStyle: styles.strongText };

    return {};
  })();

  const composedTextStyle: StyleProp<TextStyle> = [textStyle, expandedTextStyle];

  const getTextElement = ({ element, elementKey }: { element: XMLElement; elementKey: string }) => (
    <Text key={elementKey} style={composedTextStyle}>
      {drawText({ element, parentKey: elementKey })}
    </Text>
  );

  if (name === BodyXMLElementName.Emphasis || name === BodyXMLElementName.Strong)
    return elements.map((element, index) =>
      getTextElement({ element, elementKey: `${parentKey}${element.name}${index}` }),
    );

  const mappedElements = elements.map((element, index) => {
    const elementKey = `${parentKey}${element.name}${index}`;

    if (element.type === XMLElementType.Element)
      return drawText({ element, expandedTextStyle: composedTextStyle, parentKey: elementKey });

    return getTextElement({ element, elementKey });
  });

  const elementKey = `${parentKey}${name}`;

  if (name === BodyXMLElementName.P)
    return (
      <View key={elementKey} style={style}>
        <Text style={textStyle}>{mappedElements}</Text>
      </View>
    );

  return (
    <View key={elementKey} style={style}>
      {mappedElements}
    </View>
  );
};

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
