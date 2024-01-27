import { type StyleProp, Text, type TextStyle } from 'react-native';
import type { XMLElementText } from 'entities/book-reader';

interface GetTextElementProps {
  element: XMLElementText;
  elementKey: string;
  style: StyleProp<TextStyle>;
}

export const getTextElement = ({ element: { text }, elementKey, style }: GetTextElementProps) => (
  <Text key={elementKey} style={style}>
    {typeof text === 'string' ? text.replace(/((\n)|(\s))+/g, ' ') : text}
  </Text>
);
