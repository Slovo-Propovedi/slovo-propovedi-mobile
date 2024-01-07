import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';
import { BodyXMLElementName, XMLElementType } from 'entities/book-reader';
import type { XMLElement } from 'entities/book-reader';
import { FONT_SIZES, INDENTS } from 'shared';

export const drawText = (
  { elements, name, text, type }: XMLElement,
  expandedTextStyle?: StyleProp<TextStyle>,
): React.ReactNode => {
  if (type === XMLElementType.Element) {
    if (!elements || !elements.length) {
      return null;
    }

    if (name === BodyXMLElementName.Emphasis || name === BodyXMLElementName.Strong) {
      const style = ((): StyleProp<TextStyle> => {
        if (name === BodyXMLElementName.Emphasis) {
          return { fontStyle: 'italic' };
        }

        if (name === BodyXMLElementName.Strong) {
          return { fontWeight: 'bold' };
        }

        return;
      })();

      return elements.map((element, index) => (
        <Text key={index} style={[style, expandedTextStyle]}>
          {drawText(element)}
        </Text>
      ));
    }

    const { style, textStyle } = ((): {
      style?: StyleProp<ViewStyle>;
      textStyle?: StyleProp<TextStyle>;
    } => {
      if (name === BodyXMLElementName.P) {
        return {
          style: [
            {
              marginVertical: INDENTS.low,
            },
          ],
          textStyle: {
            fontSize: FONT_SIZES.h4,
          },
        };
      }

      if (name === BodyXMLElementName.Subtitle) {
        return { style: {}, textStyle: { fontSize: FONT_SIZES.h2 } };
      }

      if (name === BodyXMLElementName.Title) {
        return { style: {}, textStyle: { fontSize: FONT_SIZES.h1 } };
      }

      return {};
    })();

    const mappedElements = elements.map((element, index) => {
      const composedTextStyle: StyleProp<TextStyle> = [textStyle, expandedTextStyle];
      if (element.type === XMLElementType.Text) {
        return (
          <Text key={index} style={composedTextStyle}>
            {drawText(element)}
          </Text>
        );
      }

      return drawText(element, composedTextStyle);
    });

    if (name === BodyXMLElementName.P) {
      return (
        <View style={style}>
          <Text style={{ flexWrap: 'wrap' }}>{mappedElements}</Text>
        </View>
      );
    }

    return <View style={style}>{mappedElements}</View>;
  }

  if (typeof text === 'string') {
    text = text.replace(/((\n)|(\s))+/g, ' ');
  }

  return text || '';
};
