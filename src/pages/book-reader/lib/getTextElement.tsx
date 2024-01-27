import { type StyleProp, Text, type TextStyle } from 'react-native';
import type { XMLElement } from 'entities/book-reader';
import { parseObjectToStylizedElements } from './parseObjectToStylizedElements';

interface GetTextElementProps {
  element: XMLElement;
  elementKey: string;
  style: StyleProp<TextStyle>;
}

export const getTextElement = ({ element, elementKey, style }: GetTextElementProps) => (
  <Text key={elementKey} style={style}>
    {parseObjectToStylizedElements({ element, parentKey: elementKey })}
  </Text>
);
